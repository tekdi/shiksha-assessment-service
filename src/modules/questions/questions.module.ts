import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { TestsModule } from '../tests/tests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionOption]),
    TestsModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService, TypeOrmModule],
})
export class QuestionsModule {} 