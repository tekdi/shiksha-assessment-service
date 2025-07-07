import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { Question } from '../questions/entities/question.entity';
import { PluginModule } from '../plugins/plugin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestAttempt,
      TestUserAnswer,
      Question,
    ]),
    PluginModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {} 