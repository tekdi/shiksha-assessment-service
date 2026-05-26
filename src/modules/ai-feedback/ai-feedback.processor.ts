import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { isAxiosError } from 'axios';
import {
  TestUserAnswerAIFeedbackJob,
  AIFeedbackJobStatus,
} from './entities/test-user-answer-ai-feedback-job.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { Question } from '../questions/entities/question.entity';
import { DevRevService } from './devrev.service';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import { AiFeedbackQueueJobData, QuestionContext } from './interfaces/ai-feedback.interface';
import {
  AI_FEEDBACK_QUEUE,
  AI_FEEDBACK_RETRY_JOB_NAME,
  QUEUE_CONCURRENCY,
  QUEUE_RATE_LIMIT_MAX,
  QUEUE_RATE_LIMIT_DURATION_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
  BACKOFF_BASE_DELAY_MS,
  AUTO_RETRY_MAX_COUNT,
  AUTO_RETRY_MIN_AGE_MINUTES,
} from './ai-feedback.constants';

@Processor(AI_FEEDBACK_QUEUE, {
  concurrency: QUEUE_CONCURRENCY,
  limiter: {
    max: QUEUE_RATE_LIMIT_MAX,
    duration: QUEUE_RATE_LIMIT_DURATION_MS,
  },
  settings: {
    backoffStrategy: (attemptsMade: number, _type: string, err: any) => {
      // If the processor attached a .delay (e.g. DevRev 429), honour it
      if (err?.delay) return err.delay;
      // Otherwise standard exponential: 5s, 10s, 20s, 40s
      return BACKOFF_BASE_DELAY_MS * Math.pow(2, attemptsMade);
    },
  },
})
export class AiFeedbackProcessor extends WorkerHost {
  private readonly logger = new Logger(AiFeedbackProcessor.name);

  constructor(
    @InjectRepository(TestUserAnswerAIFeedbackJob)
    private readonly jobRepository: Repository<TestUserAnswerAIFeedbackJob>,
    @InjectRepository(TestUserAnswer)
    private readonly answerRepository: Repository<TestUserAnswer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly devRevService: DevRevService,
    private readonly jobService: AiFeedbackJobService,
  ) {
    super();
  }

  async process(queueJob: Job<AiFeedbackQueueJobData>): Promise<void> {
    // Repeatable retry sweep — distributed-safe via BullMQ/Redis
    if (queueJob.name === AI_FEEDBACK_RETRY_JOB_NAME) {
      return this.processRetryFailedJobs();
    }

    const { jobId } = queueJob.data;
    this.logger.log(`[processor] Processing queue job for DB job ${jobId}, attempt #${queueJob.attemptsMade + 1}`);

    const dbJob = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!dbJob) {
      this.logger.warn(`[processor] DB job ${jobId} not found — skipping`);
      return;
    }

    if (dbJob.status === AIFeedbackJobStatus.COMPLETED) {
      this.logger.warn(`[processor] DB job ${jobId} already COMPLETED — skipping`);
      return;
    }

    // Mark processing
    await this.jobRepository.update(jobId, {
      status: AIFeedbackJobStatus.PROCESSING,
      startedAt: new Date(),
    } as any);

    try {
      const questionContext = await this.buildQuestionContext(dbJob);

      const { requestPayload, agentRequestId } =
        await this.devRevService.executeAssessmentFeedbackAgent(dbJob, questionContext);

      const sessionObject = `${dbJob.attemptId}_${dbJob.questionId}`;

      const updateFields: Partial<TestUserAnswerAIFeedbackJob> = {
        requestPayload: requestPayload as any,
        sessionObject,
        agentId: this.devRevService.configuredAgentId,
      };
      if (agentRequestId) updateFields.agentRequestId = agentRequestId;
      await this.jobRepository.update(jobId, updateFields as any);

      this.logger.log(`[processor] DevRev agent triggered for job ${jobId}`);
    } catch (err) {
      const is429 = isAxiosError(err) && err.response?.status === 429;

      this.logger.error(
        `[processor] Job ${jobId} failed (attempt #${queueJob.attemptsMade + 1})${is429 ? ' — DevRev rate limited (429)' : ''}: ${err?.message}`,
      );

      // Update retry count in DB
      await this.jobRepository.update(jobId, {
        retryCount: (dbJob.retryCount ?? 0) + 1,
        failureReason: is429 ? 'DevRev rate limit (429)' : err?.message,
      } as any);

      // 4xx errors (except 429) are not retryable — fail immediately
      const status = isAxiosError(err) ? (err.response?.status ?? 0) : 0;
      const is4xx = status >= 400 && status < 500 && !is429;
      if (is4xx) {
        await this.jobRepository.update(jobId, { status: AIFeedbackJobStatus.FAILED } as any);
        throw new UnrecoverableError(`DevRev API ${err.response?.status}: ${err?.message}`);
      }

      // For 429: delay before retry
      if (is429) {
        const rateLimitErr = new Error(`DevRev rate limit (429) — retry in ${RATE_LIMIT_RETRY_DELAY_MS}ms`);
        (rateLimitErr as any).delay = RATE_LIMIT_RETRY_DELAY_MS;
        throw rateLimitErr;
      }

      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(queueJob: Job<AiFeedbackQueueJobData>, err: Error): Promise<void> {
    const { jobId } = queueJob.data;
    const isLastAttempt = queueJob.attemptsMade >= (queueJob.opts?.attempts ?? 1);

    if (isLastAttempt) {
      this.logger.error(`[processor] Job ${jobId} exhausted all retries — marking FAILED: ${err?.message}`);

      await this.jobRepository.update(jobId, {
        status: AIFeedbackJobStatus.FAILED,
        failureReason: err?.message ?? 'All retries exhausted',
      } as any);

      await this.answerRepository.update(queueJob.data.attemptAnsId, { aiReviewStatus: 'FAILED' });
    } else {
      this.logger.warn(
        `[processor] Job ${jobId} failed attempt #${queueJob.attemptsMade} — will retry: ${err?.message}`,
      );
    }
  }

  private async processRetryFailedJobs(): Promise<void> {
    const cutoff = new Date(Date.now() - AUTO_RETRY_MIN_AGE_MINUTES * 60 * 1000);

    const failedJobs = await this.jobRepository.find({
      where: { status: AIFeedbackJobStatus.FAILED, updatedAt: LessThan(cutoff) },
      select: ['id', 'autoRetryCount', 'failureReason'],
      order: { updatedAt: 'ASC' },
    });

    const eligible = failedJobs.filter((j) => (j.autoRetryCount ?? 0) < AUTO_RETRY_MAX_COUNT);
    const exhausted = failedJobs.length - eligible.length;

    this.logger.log(
      `[retry-sweep] Found ${failedJobs.length} failed jobs: ${eligible.length} eligible, ${exhausted} permanently failed`,
    );

    let retried = 0;
    let skipped = 0;

    for (const job of eligible) {
      try {
        await this.jobRepository.update(job.id, {
          autoRetryCount: (job.autoRetryCount ?? 0) + 1,
          failureReason: null,
        } as any);
        await this.jobService.retryFailedJob(job.id);
        retried++;
      } catch (err) {
        this.logger.error(`[retry-sweep] Failed to re-enqueue job ${job.id}: ${err?.message}`);
        skipped++;
      }
    }

    this.logger.log(`[retry-sweep] Done: ${retried} re-enqueued, ${skipped} errors, ${exhausted} permanently failed`);
  }

  private async buildQuestionContext(
    job: TestUserAnswerAIFeedbackJob,
  ): Promise<QuestionContext> {
    const [answer, question] = await Promise.all([
      this.answerRepository.findOne({ where: { attemptAnsId: job.attemptAnsId } }),
      this.questionRepository.findOne({ where: { questionId: job.questionId } }),
    ]);

    if (!answer) {
      throw new UnrecoverableError(`Answer not found for attemptAnsId=${job.attemptAnsId}`);
    }

    if (!question) {
      throw new UnrecoverableError(`Question not found for questionId=${job.questionId}`);
    }

    return {
      questionId: job.questionId,
      questionText: question.text ?? '',
      answer: answer.answer ?? '',
      rubric: question.params?.rubric?.criteria ?? undefined,
      maxScore: question.marks ?? undefined,
    };
  }
}
