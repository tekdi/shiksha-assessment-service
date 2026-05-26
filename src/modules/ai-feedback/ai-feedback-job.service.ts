import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  TestUserAnswerAIFeedbackJob,
  AIFeedbackJobStatus,
} from './entities/test-user-answer-ai-feedback-job.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { DevRevService } from './devrev.service';
import {
  CreateAiFeedbackJobsInput,
  DevRevAgentResponse,
  AiFeedbackResult,
  AiFeedbackQueueJobData,
} from './interfaces/ai-feedback.interface';
import {
  AI_FEEDBACK_QUEUE,
  AI_FEEDBACK_JOB_NAME,
  MAX_JOB_ATTEMPTS,
  BACKOFF_BASE_DELAY_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
} from './ai-feedback.constants';

const AI_REVIEW_STATUS_PENDING = 'PENDING';
const AI_REVIEW_STATUS_COMPLETED = 'COMPLETED';
const AI_REVIEW_STATUS_FAILED = 'FAILED';

@Injectable()
export class AiFeedbackJobService {
  private readonly logger = new Logger(AiFeedbackJobService.name);

  constructor(
    @InjectRepository(TestUserAnswerAIFeedbackJob)
    private readonly jobRepository: Repository<TestUserAnswerAIFeedbackJob>,
    @InjectRepository(TestUserAnswer)
    private readonly answerRepository: Repository<TestUserAnswer>,
    private readonly devRevService: DevRevService,
    @InjectQueue(AI_FEEDBACK_QUEUE)
    private readonly aiFeedbackQueue: Queue<AiFeedbackQueueJobData>,
  ) {}

  async createJobsForAttempt(input: CreateAiFeedbackJobsInput): Promise<void> {
    const { attemptId, tenantId, organisationId, rubricId, answers } = input;

    // Save DB tracking rows
    const dbJobs = answers.map((ans) =>
      this.jobRepository.create({
        tenantId,
        organisationId,
        attemptId,
        attemptAnsId: ans.attemptAnsId,
        questionId: ans.questionId,
        status: AIFeedbackJobStatus.PENDING,
        webhookReceived: false,
        retryCount: 0,
        rubricId: rubricId ?? undefined,
        agentId: this.devRevService.configuredAgentId,
        webhookId: this.devRevService.configuredWebhookId,
      }),
    );

    const savedJobs = await this.jobRepository.save(dbJobs);

    // Mark all answers as PENDING
    await this.answerRepository
      .createQueryBuilder()
      .update(TestUserAnswer)
      .set({ aiReviewStatus: AI_REVIEW_STATUS_PENDING })
      .where('attemptAnsId IN (:...ids)', {
        ids: answers.map((a) => a.attemptAnsId),
      })
      .execute();

    // Enqueue one BullMQ job per answer — queue controls concurrency & rate limit
    const queueJobs = savedJobs.map((job) => ({
      name: AI_FEEDBACK_JOB_NAME,
      data: {
        jobId: job.id,
        attemptAnsId: job.attemptAnsId,
        attemptId: job.attemptId,
        questionId: job.questionId,
        tenantId: job.tenantId,
        organisationId: job.organisationId,
        rubricId: job.rubricId ?? undefined,
      } as AiFeedbackQueueJobData,
      opts: {
        attempts: MAX_JOB_ATTEMPTS,
        backoff: {
          type: 'custom', // handled in processor via error.rateLimitDelay
          delay: BACKOFF_BASE_DELAY_MS,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    }));

    await this.aiFeedbackQueue.addBulk(queueJobs);

    this.logger.log(
      `Enqueued ${savedJobs.length} AI feedback jobs for attempt ${attemptId}`,
    );
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job || job.status !== AIFeedbackJobStatus.FAILED) return;

    await this.jobRepository.update(jobId, {
      status: AIFeedbackJobStatus.PENDING,
      retryCount: job.retryCount + 1,
      failureReason: null,
    } as any);

    await this.aiFeedbackQueue.add(
      AI_FEEDBACK_JOB_NAME,
      {
        jobId: job.id,
        attemptAnsId: job.attemptAnsId,
        attemptId: job.attemptId,
        questionId: job.questionId,
        tenantId: job.tenantId,
        organisationId: job.organisationId,
        rubricId: job.rubricId ?? undefined,
      },
      {
        attempts: MAX_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: BACKOFF_BASE_DELAY_MS },
      },
    );

    this.logger.log(`Re-enqueued failed job ${jobId}`);
  }

  async handleProgressEvent(agentResponse: DevRevAgentResponse): Promise<void> {
    const jobId = agentResponse.client_metadata?.jobId;
    if (!jobId) return;

    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job || job.status === AIFeedbackJobStatus.COMPLETED) return;

    const progressState = agentResponse.progress?.progress_state;
    const skillName =
      agentResponse.progress?.skill_triggered?.skill_name ||
      agentResponse.progress?.skill_executed?.skill_name;

    await this.jobRepository.update(jobId, {
      eventType: 'progress',
      ...(progressState ? { lastProgressState: progressState } : {}),
      responsePayload: agentResponse as any,
    } as any);

    this.logger.log(
      `Progress event for job ${jobId}: state=${progressState}, skill=${skillName}`,
    );
  }

  async handleMessageEvent(agentResponse: DevRevAgentResponse): Promise<void> {
    const jobId = agentResponse.client_metadata?.jobId;

    this.logger.log(`[handleMessageEvent] jobId=${jobId}, attemptAnsId=${agentResponse.client_metadata?.attemptAnsId}`);

    if (!jobId) {
      this.logger.warn('[handleMessageEvent] No jobId in client_metadata — cannot process');
      return;
    }

    let job: TestUserAnswerAIFeedbackJob | null;
    try {
      job = await this.jobRepository.findOne({ where: { id: jobId } });
    } catch (err) {
      this.logger.error(`[handleMessageEvent] DB error fetching job ${jobId}: ${err?.message}`);
      throw err;
    }

    if (!job) {
      this.logger.warn(`[handleMessageEvent] Job ${jobId} not found in DB`);
      return;
    }

    // Idempotency: skip already-completed jobs
    if (job.status === AIFeedbackJobStatus.COMPLETED) {
      this.logger.warn(`[handleMessageEvent] Job ${jobId} already COMPLETED — skipping duplicate webhook`);
      return;
    }

    const rawMessage = agentResponse.message ?? '';
    this.logger.log(`[handleMessageEvent] Raw message length=${rawMessage.length}`);

    const feedbackResult = this.parseFeedbackResult(rawMessage, jobId);
    const devrevSessionId = agentResponse.session;

    // Step 1: update job status
    try {
      await this.jobRepository.update(jobId, {
        status: AIFeedbackJobStatus.COMPLETED,
        completedAt: new Date(),
        webhookReceived: true,
        eventType: 'message',
        responsePayload: agentResponse as any,
        ...(devrevSessionId ? { devrevSessionId } : {}),
      } as any);
      this.logger.log(`[handleMessageEvent] Job ${jobId} marked COMPLETED`);
    } catch (err) {
      this.logger.error(`[handleMessageEvent] Failed to update job ${jobId}: ${err?.message}`);
      throw err;
    }

    // Step 2: update answer with AI feedback
    try {
      const updateResult = await this.answerRepository
        .createQueryBuilder()
        .update(TestUserAnswer)
        .set({
          aiScore: feedbackResult?.score ?? undefined,
          aiFeedback: (feedbackResult ?? undefined) as any,
          aiRawFeedback: rawMessage,
          aiGeneratedAt: new Date(),
          aiReviewStatus: AI_REVIEW_STATUS_COMPLETED,
          aiModel: this.devRevService.configuredAgentId,
          aiPromptVersion: this.devRevService.promptVersion,
        })
        .where('attemptAnsId = :id', { id: job.attemptAnsId })
        .execute();

      this.logger.log(
        `[handleMessageEvent] Answer updated for attemptAnsId=${job.attemptAnsId}, affected=${updateResult.affected}, score=${feedbackResult?.score}`,
      );
    } catch (err) {
      this.logger.error(`[handleMessageEvent] Failed to update answer ${job.attemptAnsId}: ${err?.message}`);
      throw err;
    }
  }

  async handleErrorEvent(agentResponse: DevRevAgentResponse): Promise<void> {
    const jobId = agentResponse.client_metadata?.jobId;
    if (!jobId) return;

    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job || job.status === AIFeedbackJobStatus.COMPLETED) return;

    const failureReason =
      agentResponse.error?.message ?? 'DevRev agent error event';

    await this.jobRepository.update(jobId, {
      status: AIFeedbackJobStatus.FAILED,
      failureReason,
      webhookReceived: true,
      eventType: 'error',
      responsePayload: agentResponse as any,
    } as any);

    await this.answerRepository
      .createQueryBuilder()
      .update()
      .set({ aiReviewStatus: AI_REVIEW_STATUS_FAILED })
      .where('"attemptAnsId" = :id', { id: job.attemptAnsId })
      .execute();

    this.logger.error(`[handleErrorEvent] Job ${jobId} marked FAILED: ${failureReason}`);
  }

  private parseFeedbackResult(
    raw: string,
    jobId: string,
  ): AiFeedbackResult | null {
    if (!raw) return null;

    // Try strict JSON first
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (
        typeof parsed.score === 'number' &&
        typeof parsed.maxScore === 'number' &&
        Array.isArray(parsed.strengths) &&
        Array.isArray(parsed.areasForImprovement) &&
        typeof parsed.overallFeedback === 'string'
      ) {
        this.logger.log(`Job ${jobId}: JSON feedback parsed, score=${parsed.score}/${parsed.maxScore}`);
        return parsed as AiFeedbackResult;
      }
    } catch {
      // Agent returned markdown — extract structured fields below
    }

    // Extract score: matches "6/8", "14 / 15", "**6/8**", "Score: 6/8"
    const scoreMatch = /\*{0,2}(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\*{0,2}/.exec(raw);
    const score = scoreMatch ? Number.parseFloat(scoreMatch[1]) : 0;
    const maxScore = scoreMatch ? Number.parseFloat(scoreMatch[2]) : 0;

    // Extract strengths: numbered/bulleted items under a Strengths section
    const strengths = this.extractSection(raw, ['strengths', 'strength']);

    // Extract areas for improvement: under Gaps/Improvements/Areas section
    const areasForImprovement = this.extractSection(raw, [
      'gaps to address',
      'areas for improvement',
      'improvement',
      'suggestions to improve',
      'suggestions',
    ]);

    this.logger.log(`Job ${jobId}: markdown feedback parsed, score=${score}/${maxScore}, strengths=${strengths.length}, improvements=${areasForImprovement.length}`);

    return {
      score,
      maxScore,
      strengths,
      areasForImprovement,
      overallFeedback: raw,
    };
  }

  private extractSection(markdown: string, headingKeywords: string[]): string[] {
    const lines = markdown.split('\n');
    const items: string[] = [];
    let inSection = false;

    for (const line of lines) {
      const heading = line.replace(/[#*_]/g, '').toLowerCase().trim();

      // Detect section start
      if (headingKeywords.some((kw) => heading.includes(kw))) {
        inSection = true;
        continue;
      }

      // Stop at next heading
      if (inSection && /^#{1,4}\s/.test(line) && line.trim().length > 1) {
        break;
      }

      if (!inSection) continue;

      // Extract numbered or bulleted items: "1. text", "- text", "* text", "**Title:** text"
      const itemMatch = /^[\s]*(?:\d+\.|[-*•])\s+(?:\*{1,2}[^*]+\*{1,2}[:\s—–-]*)?\s*(.+)/.exec(line);
      if (itemMatch) {
        const text = itemMatch[1].replace(/\*{1,2}/g, '').trim();
        if (text.length > 3) items.push(text);
      }
    }

    return items;
  }
}
