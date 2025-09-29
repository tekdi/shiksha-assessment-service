import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewTestAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReviewTestAttemptDto {
  @ApiProperty({ type: [ReviewTestAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewTestAnswerDto)
  answers: ReviewTestAnswerDto[];

  @ApiPropertyOptional()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallRemarks?: string;
}