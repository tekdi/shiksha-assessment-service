import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { TestsModule } from '../tests/tests.module';
import { OrderingService } from '@/common/services/ordering.service';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestSection } from '../tests/entities/test-section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionOption, TestQuestion, TestSection]),
    TestsModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, OrderingService],
  exports: [QuestionsService],
})
export class QuestionsModule {} 