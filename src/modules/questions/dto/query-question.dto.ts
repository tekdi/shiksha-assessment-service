import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionLevel, QuestionStatus } from '../entities/question.entity';
import { PaginationDto } from '@/common/dto/base.dto';

export class QueryQuestionDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: QuestionStatus })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxMarks?: number;
} 