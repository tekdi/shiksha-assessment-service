import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class AddQuestionToTestDto {
  @ApiProperty({
    description: 'ID of the section where the question will be added',
    example: 'section-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  sectionId: string;

  @ApiProperty({
    description: 'ID of the question to add to the test section',
    example: 'question-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Whether this question is compulsory (optional)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a conditional question',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isConditional?: boolean;
} 