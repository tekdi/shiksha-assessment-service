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

  /** Filter by metadata.context.type (e.g. PATHWAY, EVENT) - uses JSONB index-friendly path */
  @ApiPropertyOptional({ description: 'Filter by metadata.context.type e.g. PATHWAY, EVENT' })
  @IsOptional()
  @IsString()
  contextType?: string;

  /** Filter by metadata.context.id - comma-separated; matches string id or id in array */
  @ApiPropertyOptional({ description: 'Filter by metadata.context.id (comma-separated)', example: 'EVT_501' })
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
}
