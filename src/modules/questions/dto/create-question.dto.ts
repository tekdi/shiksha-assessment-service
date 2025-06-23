import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionLevel, QuestionStatus, GradingType, QuestionParams } from '../entities/question.entity';

export class RubricCriteriaDto {
  @ApiProperty()
  @IsString()
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
  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matchWith?: string;

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
  @ApiProperty()
  @IsString()
  title: string;

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
} 