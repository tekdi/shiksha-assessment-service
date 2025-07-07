import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { Test } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question } from '../questions/entities/question.entity';
import { PluginModule } from '../plugins/plugin.module';
import { TestsModule } from '../tests/tests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestAttempt,
      TestUserAnswer,
      Test,
      TestQuestion,
      TestRule,
      Question,
    ]),
    PluginModule,
    TestsModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {} 