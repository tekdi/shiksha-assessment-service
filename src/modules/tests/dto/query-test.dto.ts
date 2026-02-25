import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, IsUUID } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filter by metadata context e.g. PATHWAY' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Filter by metadata subType e.g. EVENT' })
  @IsOptional()
  @IsString()
  subType?: string;

  @ApiPropertyOptional({ description: 'Filter tests whose metadata.Ids contains any of these IDs (comma-separated)', example: '9a9e0daa-50dd-4d0e-8d10-36e7bc808f88' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((s: string) => s.trim()).filter(Boolean) : value))
  @IsArray()
  @IsUUID('4', { each: true })
  Ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
}
