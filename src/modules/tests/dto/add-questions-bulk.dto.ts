import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsArray, ArrayMinSize, ValidateNested, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionToAddDto {
  @ApiProperty({
    description: 'ID of the question to add to the test section',
    example: 'question-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Ordering position of the question in the section (optional)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  ordering?: number;

  @ApiProperty({
    description: 'Whether this question is compulsory (optional)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;
}

export class AddQuestionsBulkDto {
  @ApiProperty({
    description: 'ID of the section where the questions will be added',
    example: 'section-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  sectionId: string;

  @ApiProperty({
    description: 'Array of questions to add to the test section',
    type: [QuestionToAddDto],
    example: [
      {
        questionId: 'question-123e4567-e89b-12d3-a456-426614174000',
        ordering: 1,
        isCompulsory: false
      },
      {
        questionId: 'question-456e7890-e89b-12d3-a456-426614174001',
        ordering: 2,
        isCompulsory: true
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one question must be provided' })
  @ValidateNested({ each: true })
  @Type(() => QuestionToAddDto)
  questions: QuestionToAddDto[];
} 