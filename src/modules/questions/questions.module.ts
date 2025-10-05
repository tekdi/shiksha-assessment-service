import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { OptionQuestion } from './entities/option-question.entity';
import { TestsModule } from '../tests/tests.module';
import { OrderingService } from '@/common/services/ordering.service';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestSection } from '../tests/entities/test-section.entity';
import { Test } from '../tests/entities/test.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionOption, OptionQuestion, TestQuestion, TestSection, Test]),
    forwardRef(() => TestsModule),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, OrderingService],
  exports: [QuestionsService],
})
export class QuestionsModule {} 