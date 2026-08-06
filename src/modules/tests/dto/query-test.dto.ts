import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TestStatus } from '../entities/test.entity';
import { PaginationDto } from '@/common/dto/base.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Date filter DTO that supports comparison operators.
 *
 * Usage:
 *   { "gt": "2026-03-09" }   → column > '2026-03-09'
 *   { "gte": "2026-03-09" }  → column >= '2026-03-09'
 *   { "lt": "2026-03-09" }   → column < '2026-03-09'
 *   { "lte": "2026-03-09" }  → column <= '2026-03-09'
 *   { "eq": "2026-03-09" }   → column = '2026-03-09'
 */
export class DateFilterDto {
  @ApiPropertyOptional({ description: 'Greater than (>) the given date and time (ISO 8601)', example: '2026-03-10T12:00:00Z' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(' ', 'T') : value))
  @IsDateString()
  gt?: string;

  @ApiPropertyOptional({ description: 'Greater than or equal to (>=) the given date and time (ISO 8601)', example: '2026-03-10T12:00:00Z' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(' ', 'T') : value))
  @IsDateString()
  gte?: string;

  @ApiPropertyOptional({ description: 'Less than (<) the given date and time (ISO 8601)', example: '2026-03-10T14:00:00Z' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(' ', 'T') : value))
  @IsDateString()
  lt?: string;

  @ApiPropertyOptional({ description: 'Less than or equal to (<=) the given date and time (ISO 8601)', example: '2026-03-10T14:00:00Z' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(' ', 'T') : value))
  @IsDateString()
  lte?: string;

  @ApiPropertyOptional({ description: 'Equal to (=) the given date and time (ISO 8601)', example: '2026-03-10T12:00:00Z' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(' ', 'T') : value))
  @IsDateString()
  eq?: string;
}

export class QueryTestDto extends PaginationDto {

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare search?: string;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

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

  /** Filter by contextType (e.g. PATHWAY, EVENT) */
  @ApiPropertyOptional({ description: 'Filter by contextType e.g. PATHWAY, EVENT' })
  @IsOptional()
  @IsString()
  contextType?: string;

  /** Filter by contextId - comma-separated UUIDs */
  @ApiPropertyOptional({ description: 'Filter by contextId (comma-separated UUIDs)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : value))
  @IsArray()
  @IsString({ each: true })
  contextId?: string[];
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Filter by startDate with operator. e.g. {"gt":"2026-03-09T10:00:00Z"} | {"gte":"2026-03-09T10:00:00Z"} | {"lt":"2026-03-09T20:00:00Z"} | {"lte":"2026-03-09T20:00:00Z"} | {"eq":"2026-03-09T10:00:00Z"}',
    type: DateFilterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  startDate?: DateFilterDto;

  @ApiPropertyOptional({
    description: 'Filter by endDate with operator. e.g. {"gt":"2026-03-09T10:00:00Z"} | {"gte":"2026-03-09T10:00:00Z"} | {"lt":"2026-03-09T20:00:00Z"} | {"lte":"2026-03-09T20:00:00Z"} | {"eq":"2026-03-09T10:00:00Z"}',
    type: DateFilterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateFilterDto)
  endDate?: DateFilterDto;
}
