import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFeedbackViewedDto {
  @ApiProperty({ description: 'Whether the AI feedback / answersheet has been viewed' })
  @IsBoolean()
  feedbackViewed: boolean;
}
