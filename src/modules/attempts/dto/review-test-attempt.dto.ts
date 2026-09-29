import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
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
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional()
  @IsUUID()
  testId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallRemarks?: string;
}