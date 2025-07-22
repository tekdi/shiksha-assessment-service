import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID, IsArray, ValidateNested, IsObject, IsUrl, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionLevel, QuestionStatus } from '../entities/question.entity';
import { GradingType } from '../../tests/entities/test.entity';

export class QuestionMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  video?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  audio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  document?: string;
}

export class RubricCriteriaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  maxScore: number;

  @ApiProperty()
  @IsString()
  description: string;
}

export class QuestionParamsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowAttachments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wordLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPartialScoring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rubric?: {
    criteria: RubricCriteriaDto[];
  };
}

export class CreateQuestionOptionDto {
  @ApiProperty({ 
    description: 'Option text content'
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ 
    description: 'Media URLs for the option',
    example: {
      image: "https://cdn.example.com/opt1.png",
      video: "https://cdn.example.com/opt2.mp4"
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionMediaDto)
  media?: QuestionMediaDto;

  @ApiPropertyOptional({ 
    description: 'Text for matching (used in match questions)'
  })
  @IsOptional()
  @IsString()
  matchWith?: string;

  @ApiPropertyOptional({ 
    description: 'Media URLs for matching (used in match questions)',
    example: {
      image: "https://cdn.example.com/match1.png",
      video: "https://cdn.example.com/match2.mp4"
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionMediaDto)
  matchWithMedia?: QuestionMediaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  blankIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ 
    description: 'Question text content'
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ 
    description: 'Media URLs for the question',
    example: {
      image: "https://cdn.example.com/question.png",
      video: "https://cdn.example.com/question.mp4"
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionMediaDto)
  media?: QuestionMediaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marks?: number;

  @ApiPropertyOptional({ enum: QuestionStatus })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  idealTime?: number;

  @ApiPropertyOptional({ enum: GradingType })
  @IsOptional()
  @IsEnum(GradingType)
  gradingType?: GradingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPartialScoring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionParamsDto)
  params?: QuestionParamsDto;

  @ApiPropertyOptional({ type: [CreateQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];

  @ApiPropertyOptional({
    description: 'ID of the test to add this question to (optional)',
    example: 'test-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  testId?: string;

  @ApiPropertyOptional({
    description: 'ID of the section within the test to add this question to (optional)',
    example: 'section-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({
    description: 'Whether this question is compulsory in the test (optional)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isCompulsory?: boolean;
} 