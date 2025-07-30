import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[]; // For MCQ/Multiple choice

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string; // For subjective/essay

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  matches?: Array<{
    optionId: string;
    matchWith: string;
  }>; // For matching questions - optionId matches with matchWith text

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blanks?: string[]; // For fill-in-the-blank
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AnswerDto)
  answer: AnswerDto;
}

export class SubmitMultipleAnswersDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpent?: number; // Total time spent on all questions in seconds
} 