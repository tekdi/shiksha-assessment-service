import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import {
  TestUserAnswerAIFeedbackJob,
  AIFeedbackJobStatus,
} from './entities/test-user-answer-ai-feedback-job.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { Test } from '../tests/entities/test.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import { CreateAiFeedbackJobsInput } from './interfaces/ai-feedback.interface';
import {
  AiFeedbackStatusResponseDto,
  AiFeedbackResponseDto,
} from './dto/ai-feedback.dto';
import { ConfigService } from '@nestjs/config';
import { AuthContext } from '../../common/interfaces/auth.interface';

@Injectable()
export class AiFeedbackService {
  private readonly logger = new Logger(AiFeedbackService.name);
  private readonly devRevEnabled: boolean;

  constructor(
    @InjectRepository(TestUserAnswerAIFeedbackJob)
    private readonly jobRepository: Repository<TestUserAnswerAIFeedbackJob>,
    @InjectRepository(TestUserAnswer)
    private readonly answerRepository: Repository<TestUserAnswer>,
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly jobService: AiFeedbackJobService,
    private readonly configService: ConfigService,
  ) {
    this.devRevEnabled = this.configService.get<string>('DEVREV_ENABLED', 'true') !== 'false';
    if (!this.devRevEnabled) {
      this.logger.warn('DevRev AI feedback is DISABLED (DEVREV_ENABLED=false)');
    }
  }

  async initiateAiFeedbackForAttempt(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<void> {
    if (!this.devRevEnabled) {
      this.logger.log(`AI feedback skipped for attempt ${attemptId} — DEVREV_ENABLED=false`);
      return;
    }

    const [answers, attempt] = await Promise.all([
      this.answerRepository
        .createQueryBuilder('ans')
        .innerJoin(
          Question,
          'q',
          'q.questionId = ans.questionId AND q.type IN (:...types)',
          { types: [QuestionType.SUBJECTIVE, QuestionType.ESSAY] },
        )
        .where('ans.attemptId = :attemptId', { attemptId })
        .andWhere('ans.tenantId = :tenantId', { tenantId: authContext.tenantId })
        .andWhere('ans.organisationId = :organisationId', { organisationId: authContext.organisationId })
        .select(['ans.attemptAnsId', 'ans.questionId'])
        .getMany(),
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

    const learnerName = await this.fetchLearnerName(authContext);

    const input: CreateAiFeedbackJobsInput = {
      attemptId,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      rubricId,
      learnerName,
      answers: answers.map((a) => ({
        attemptAnsId: a.attemptAnsId,
        questionId: a.questionId,
      })),
    };

    await this.jobService.createJobsForAttempt(input);

    this.logger.log(
      `AI feedback initiated for attempt ${attemptId} with ${answers.length} answers, rubricId=${rubricId}, learner=${learnerName}`,
    );
  }

  private async fetchLearnerName(authContext: AuthContext): Promise<string> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL', '');
    if (!userServiceUrl || !authContext.token || !authContext.userId) {
      return 'Learner';
    }
    try {
      const response = await axios.get(
        `${userServiceUrl}/read/${authContext.userId}`,
        {
          headers: {
            Authorization: authContext.token,
            tenantid: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
          timeout: 5_000,
        },
      );
      const { firstName, lastName } = response.data?.result?.userData ?? {};
      const name = [firstName, lastName].filter(Boolean).join(' ').trim();
      return name || 'Learner';
    } catch (err) {
      this.logger.warn(`Could not fetch learner name for userId=${authContext.userId}: ${err?.message}`);
      return 'Learner';
    }
  }

  async getAiFeedbackStatus(
    attemptId: string,
    authContext: AuthContext,
  ): Promise<AiFeedbackStatusResponseDto> {
    const jobs = await this.jobRepository
      .createQueryBuilder('job')
      .innerJoin(
        Question,
        'q',
        'q.questionId = job.questionId AND q.type IN (:...types)',
        { types: [QuestionType.SUBJECTIVE, QuestionType.ESSAY] },
      )
      .where('job.attemptId = :attemptId', { attemptId })
      .andWhere('job.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('job.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .select(['job.questionId', 'job.status', 'job.updatedAt'])
      .orderBy('job.updatedAt', 'DESC')
      .getMany();

    if (!jobs.length) {
      throw new NotFoundException(
        `No AI feedback jobs found for attempt ${attemptId}`,
      );
    }

    // Deduplicate per questionId: keep latest by updatedAt (jobs already ordered DESC)
    const latestByQuestion = new Map<string, { questionId: string; status: AIFeedbackJobStatus }>();
    for (const job of jobs) {
      if (!latestByQuestion.has(job.questionId)) {
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
