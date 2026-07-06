import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AiFeedbackRating } from '../../tests/entities/test-user-answer.entity';

export class SetAiFeedbackRatingDto {
  @ApiProperty({ enum: AiFeedbackRating, description: 'Thumbs up/down rating for the AI-generated feedback' })
  @IsEnum(AiFeedbackRating)
  rating: AiFeedbackRating;
}

export class AiFeedbackRatingResponseDto {
  @ApiProperty()
  attemptAnsId: string;

  @ApiProperty({ enum: AiFeedbackRating, nullable: true })
  rating: AiFeedbackRating | null;
}
