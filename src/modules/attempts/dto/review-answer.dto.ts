import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReviewAttemptDto {
  @ApiProperty({ type: [ReviewAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewAnswerDto)
  answers: ReviewAnswerDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallRemarks?: string;
}

export class BulkReviewDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  attemptIds: string[];

  @ApiProperty()
  @IsUUID()
  reviewerId: string;
} 