import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsNumber, IsObject } from 'class-validator';

export class RulePreviewDto {
  @ApiPropertyOptional({
    description: 'Array of category IDs to filter questions',
    example: ['cat-1', 'cat-2']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Array of difficulty levels to filter questions',
    example: ['easy', 'medium', 'hard']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficultyLevels?: string[];

  @ApiPropertyOptional({
    description: 'Array of question types to filter questions',
    example: ['mcq', 'subjective', 'essay']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];

  @ApiPropertyOptional({
    description: 'Array of marks to filter questions',
    example: [1, 2, 5, 10]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  marks?: number[];

  @ApiPropertyOptional({
    description: 'Array of tags to filter questions',
    example: ['javascript', 'react', 'nodejs']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Array of question IDs to exclude',
    example: ['qstn-1', 'qstn-2']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeQuestionIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of question IDs to include',
    example: ['qstn-3', 'qstn-4']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeQuestionIds?: string[];

  @ApiPropertyOptional({
    description: 'Time range filter for questions',
    example: {
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z'
    }
  })
  @IsOptional()
  @IsObject()
  timeRange?: {
    from: string;
    to: string;
  };
} 