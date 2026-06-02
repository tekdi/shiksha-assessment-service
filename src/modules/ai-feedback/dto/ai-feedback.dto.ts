import { ApiProperty } from '@nestjs/swagger';

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
}

export class AiFeedbackResponseDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty({ type: [AiFeedbackAnswerDto] })
  answers: AiFeedbackAnswerDto[];
}
