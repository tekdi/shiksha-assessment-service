import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TestUserAnswerAIFeedbackJob,
  AIFeedbackJobStatus,
} from './entities/test-user-answer-ai-feedback-job.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { Test } from '../tests/entities/test.entity';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import { CreateAiFeedbackJobsInput } from './interfaces/ai-feedback.interface';
import {
  AiFeedbackStatusResponseDto,
  AiFeedbackResponseDto,
} from './dto/ai-feedback.dto';
import { AuthContext } from '../../common/interfaces/auth.interface';

@Injectable()
export class AiFeedbackService {
  private readonly logger = new Logger(AiFeedbackService.name);

  constructor(
    @InjectRepository(TestUserAnswerAIFeedbackJob)
    private readonly jobRepository: Repository<TestUserAnswerAIFeedbackJob>,
    @InjectRepository(TestUserAnswer)
    private readonly answerRepository: Repository<TestUserAnswer>,
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    private readonly jobService: AiFeedbackJobService,
  ) {}

  async initiateAiFeedbackForAttempt(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<void> {
    const [answers, attempt] = await Promise.all([
      this.answerRepository.find({
        where: {
          attemptId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        select: ['attemptAnsId', 'questionId'],
      }),
      this.attemptRepository.findOne({
        where: { attemptId },
        select: ['testId'],
      }),
    ]);

    if (!answers.length) {
      this.logger.log(`No answers found for attempt ${attemptId}, skipping AI feedback`);
      return;
    }

    let rubricId: string | undefined;
    if (attempt?.testId) {
      const test = await this.testRepository.findOne({
        where: { testId: attempt.testId },
        select: ['aiEnabled', 'aiRubricId'],
      });

      if (!test?.aiEnabled) {
        this.logger.log(`AI feedback disabled for testId=${attempt.testId} — skipping`);
        return;
      }

      if (!test?.aiRubricId) {
        this.logger.warn(`AI feedback enabled but aiRubricId not set for testId=${attempt.testId} — skipping`);
        return;
      }

      rubricId = test.aiRubricId;
    } else {
      this.logger.warn(`Could not resolve testId for attempt ${attemptId} — skipping AI feedback`);
      return;
    }

    const input: CreateAiFeedbackJobsInput = {
      attemptId,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      rubricId,
      answers: answers.map((a) => ({
        attemptAnsId: a.attemptAnsId,
        questionId: a.questionId,
      })),
    };

    await this.jobService.createJobsForAttempt(input);

    this.logger.log(
      `AI feedback initiated for attempt ${attemptId} with ${answers.length} answers, rubricId=${rubricId}`,
    );
  }

  async getAiFeedbackStatus(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<AiFeedbackStatusResponseDto> {
    const jobs = await this.jobRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      select: ['questionId', 'status', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });

    if (!jobs.length) {
      throw new NotFoundException(
        `No AI feedback jobs found for attempt ${attemptId}`,
      );
    }

    // Deduplicate per questionId: prefer COMPLETED, else take latest by updatedAt
    const latestByQuestion = new Map<string, { questionId: string; status: AIFeedbackJobStatus }>();
    for (const job of jobs) {
      const existing = latestByQuestion.get(job.questionId);
      if (!existing || job.status === AIFeedbackJobStatus.COMPLETED) {
        latestByQuestion.set(job.questionId, { questionId: job.questionId, status: job.status });
      }
    }

    const deduplicated = Array.from(latestByQuestion.values());
    const completed = deduplicated.filter((j) => j.status === AIFeedbackJobStatus.COMPLETED).length;

    return {
      completed,
      total: deduplicated.length,
      questions: deduplicated,
    };
  }

  async getAiFeedback(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<AiFeedbackResponseDto> {
    const answers = await this.answerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!answers.length) {
      throw new NotFoundException(`No answers found for attempt ${attemptId}`);
    }

    return {
      attemptId,
      answers: answers.map((a) => ({
        attemptAnsId: a.attemptAnsId,
        questionId: a.questionId,
        answer: a.answer,
        aiScore: a.aiScore,
        aiFeedback: a.aiFeedback,
        aiRawFeedback: a.aiRawFeedback,
        aiReviewStatus: a.aiReviewStatus,
        aiGeneratedAt: a.aiGeneratedAt,
      })),
    };
  }

  async retryFailedJobs(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<{ retried: number }> {
    const failedJobs = await this.jobRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: AIFeedbackJobStatus.FAILED,
      },
    });

    let retried = 0;
    for (const job of failedJobs) {
      await this.jobService.retryFailedJob(job.id).catch((err) => {
        this.logger.error(`Retry failed for job ${job.id}: ${err?.message}`);
      });
      retried++;
    }

    return { retried };
  }
}
