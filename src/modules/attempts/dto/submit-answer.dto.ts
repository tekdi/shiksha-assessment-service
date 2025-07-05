import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @ApiPropertyOptional({ 
    type: [String],
    description: 'Selected option IDs for MCQ, TRUE_FALSE, MULTIPLE_ANSWER, FILL_BLANK, and MATCH questions'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[]; // For MCQ, TRUE_FALSE, MULTIPLE_ANSWER, FILL_BLANK, MATCH

  @ApiPropertyOptional({
    description: 'Text answer for SUBJECTIVE and ESSAY questions'
  })
  @IsOptional()
  @IsString()
  text?: string; // For SUBJECTIVE, ESSAY

  // Legacy fields for backward compatibility (deprecated)
  @ApiPropertyOptional({ type: [String], deprecated: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matches?: string[]; // Deprecated - use selectedOptionIds for MATCH questions

  @ApiPropertyOptional({ type: [String], deprecated: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blanks?: string[]; // Deprecated - use selectedOptionIds for FILL_BLANK questions
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AnswerDto)
  answer: AnswerDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpent?: number; // Time spent on this question in seconds
} 