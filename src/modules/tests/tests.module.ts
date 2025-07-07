import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { QuestionPoolService } from './question-pool.service';
import { Test } from './entities/test.entity';
import { TestSection } from './entities/test-section.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestRule } from './entities/test-rule.entity';
import { TestUserAnswer } from './entities/test-user-answer.entity';
import { Question } from '../questions/entities/question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      TestSection,
      TestQuestion,
      TestAttempt,
      TestRule,
      TestUserAnswer,
      Question,
    ]),
  ],
  controllers: [TestsController, SectionsController, RulesController],
  providers: [TestsService, SectionsService, RulesService, QuestionPoolService],
  exports: [TestsService, SectionsService, RulesService, QuestionPoolService],
})
export class TestsModule {} 