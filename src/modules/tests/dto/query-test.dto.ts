import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TestStatus } from '../entities/test.entity';
import { PaginationDto } from '@/common/dto/base.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
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

  @ApiPropertyOptional({ description: 'Filter by startDate (createdAt > startDate)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by endDate (createdAt < endDate)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
