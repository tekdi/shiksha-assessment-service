import { ApiProperty } from '@nestjs/swagger';
import { AiFeedbackRating } from '../../tests/entities/test-user-answer.entity';

export class AiFeedbackStatusQuestionDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  status: string;
}

export class AiFeedbackStatusResponseDto {
  @ApiProperty()
  completed: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [AiFeedbackStatusQuestionDto] })
  questions: AiFeedbackStatusQuestionDto[];
}

export class AiFeedbackAnswerDto {
  @ApiProperty()
  attemptAnsId: string;

  @ApiProperty()
  questionId: string;

  @ApiProperty()
  answer: string;

  @ApiProperty({ nullable: true })
  aiScore: number;

  @ApiProperty({ nullable: true })
  aiFeedback: Record<string, any>;

  @ApiProperty({ nullable: true })
  aiReviewStatus: string;

  @ApiProperty({ nullable: true })
  aiGeneratedAt: Date;

  @ApiProperty({ nullable: true })
  aiRawFeedback: string;

  @ApiProperty({ enum: AiFeedbackRating, nullable: true })
  feedbackRating: AiFeedbackRating | null;
}

export class AiFeedbackResponseDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  feedbackViewed: boolean;

  @ApiProperty({ type: [AiFeedbackAnswerDto] })
  answers: AiFeedbackAnswerDto[];
}
