import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { TestUserAnswerAIFeedbackJob } from './entities/test-user-answer-ai-feedback-job.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { Test } from '../tests/entities/test.entity';
import { Question } from '../questions/entities/question.entity';
import { DevRevService } from './devrev.service';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import { AiFeedbackService } from './ai-feedback.service';
import { AiFeedbackController } from './ai-feedback.controller';
import { AiFeedbackProcessor } from './ai-feedback.processor';
import { AiFeedbackRetryScheduler } from './ai-feedback-retry.scheduler';
import { AI_FEEDBACK_QUEUE } from './ai-feedback.constants';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      TestUserAnswerAIFeedbackJob,
      TestUserAnswer,
      TestAttempt,
      Test,
      Question,
    ]),
    // Register Redis connection for BullMQ using existing REDIS_* env vars
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
    // Register the queue with rate limiter — max 20 DevRev calls per second
    BullModule.registerQueue({
      name: AI_FEEDBACK_QUEUE,
      defaultJobOptions: {
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 5_000, // 5s, 10s, 20s, 40s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    }),
  ],
  controllers: [AiFeedbackController],
  providers: [
    DevRevService,
    AiFeedbackJobService,
    AiFeedbackService,
    AiFeedbackProcessor,
    AiFeedbackRetryScheduler,
  ],
  exports: [AiFeedbackService],
})
export class AiFeedbackModule {}
