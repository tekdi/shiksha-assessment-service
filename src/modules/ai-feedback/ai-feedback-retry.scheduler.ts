import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  TestUserAnswerAIFeedbackJob,
  AIFeedbackJobStatus,
} from './entities/test-user-answer-ai-feedback-job.entity';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import {
  AUTO_RETRY_CRON,
  AUTO_RETRY_MAX_COUNT,
  AUTO_RETRY_MIN_AGE_MINUTES,
} from './ai-feedback.constants';

@Injectable()
export class AiFeedbackRetryScheduler {
  private readonly logger = new Logger(AiFeedbackRetryScheduler.name);
  private isRunning = false;

  constructor(
    @InjectRepository(TestUserAnswerAIFeedbackJob)
    private readonly jobRepository: Repository<TestUserAnswerAIFeedbackJob>,
    private readonly jobService: AiFeedbackJobService,
  ) {}

  @Cron(AUTO_RETRY_CRON)
  async retryFailedJobs(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[scheduler] Previous run still in progress — skipping');
      return;
    }

    this.isRunning = true;
    try {
      const cutoff = new Date(Date.now() - AUTO_RETRY_MIN_AGE_MINUTES * 60 * 1000);

      const failedJobs = await this.jobRepository.find({
        where: {
          status: AIFeedbackJobStatus.FAILED,
          updatedAt: LessThan(cutoff),
        },
        select: ['id', 'attemptId', 'autoRetryCount', 'failureReason'],
        order: { updatedAt: 'ASC' },
      });

      if (!failedJobs.length) {
        this.logger.debug('[scheduler] No failed jobs eligible for retry');
        return;
      }

      const eligible = failedJobs.filter((j) => (j.autoRetryCount ?? 0) < AUTO_RETRY_MAX_COUNT);
      const exhausted = failedJobs.length - eligible.length;

      this.logger.log(
        `[scheduler] Found ${failedJobs.length} failed jobs: ${eligible.length} eligible, ${exhausted} exhausted auto-retries`,
      );

      let retried = 0;
      let skipped = 0;

      for (const job of eligible) {
        try {
          // Increment autoRetryCount before re-enqueue so a crash doesn't cause infinite loops
          await this.jobRepository.update(job.id, {
            autoRetryCount: (job.autoRetryCount ?? 0) + 1,
            failureReason: null,
          } as any);

          await this.jobService.retryFailedJob(job.id);
          retried++;
        } catch (err) {
          this.logger.error(
            `[scheduler] Failed to re-enqueue job ${job.id}: ${err?.message}`,
          );
          skipped++;
        }
      }

      this.logger.log(
        `[scheduler] Auto-retry complete: ${retried} re-enqueued, ${skipped} errors, ${exhausted} permanently failed`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
