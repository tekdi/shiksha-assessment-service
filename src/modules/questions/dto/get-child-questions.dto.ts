import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer'; 


export class ChildQuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q-123e4567-e89b-12d3-a456-426614174000'
  })
  questionId: string;

  @ApiProperty({
    description: 'Question text',
    example: 'What additional information would you like to provide?'
  })
  text: string;

  @ApiProperty({
    description: 'Question type',
    example: 'mcq'
  })
  type: string;

  @ApiProperty({
    description: 'Question marks',
    example: 2
  })
  marks: number;

  @ApiProperty({
    description: 'Parent question ID',
    example: 'parent-q-123e4567-e89b-12d3-a456-426614174000'
  })
  parentId: string;

  @ApiProperty({
    description: 'Associated option IDs (only included when includeAssociatedOptions=false)',
    example: ['opt-123e4567-e89b-12d3-a456-426614174000', 'opt-223e4567-e89b-12d3-a456-426614174001']
  })
  associatedOptionIds?: string[];

  @ApiProperty({
    description: 'Question options',
    type: 'array',
    items: { type: 'object' }
  })
  options: any[];

  @ApiProperty({
    description: 'Question status',
    example: 'draft'
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-05T15:36:06.675Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-05T15:36:06.675Z'
  })
  updatedAt: string;
}

export class GetChildQuestionsQueryDto {
  @ApiPropertyOptional({
    description: 'Include question options in response',
    example: true,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  includeOptions?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include associated option details',
    example: true,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  includeAssociatedOptions?: boolean = true;
}
