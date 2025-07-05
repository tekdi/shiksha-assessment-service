import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchAnswerDto {
  @ApiProperty({
    description: 'Option ID that is being matched',
    example: 'f55c248b-d82f-41c8-8731-231143890d1a'
  })
  @IsString()
  optionId: string;

  @ApiProperty({
    description: 'Text that the option is matched with',
    example: 'Berlin'
  })
  @IsString()
  matchWith: string;
}

export class AnswerDto {
  @ApiPropertyOptional({ 
    type: [String],
    description: 'Selected option IDs for MCQ, TRUE_FALSE, MULTIPLE_ANSWER, FILL_BLANK questions'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[]; // For MCQ, TRUE_FALSE, MULTIPLE_ANSWER, FILL_BLANK

  @ApiPropertyOptional({
    description: 'Text answer for SUBJECTIVE and ESSAY questions'
  })
  @IsOptional()
  @IsString()
  text?: string; // For SUBJECTIVE, ESSAY

  @ApiPropertyOptional({ 
    type: [MatchAnswerDto],
    description: 'Match answers for MATCH questions. Each answer contains optionId and matchWith.'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchAnswerDto)
  matches?: MatchAnswerDto[]; // For MATCH questions
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