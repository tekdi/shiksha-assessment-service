import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsUUID } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filter by pathway tests (metadata.isPathway = true)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPathway?: boolean;

  @ApiPropertyOptional({ description: 'Filter by pathway event UUID (metadata.pathway_eventId)' })
  @IsOptional()
  @IsUUID()
  pathway_eventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortOrder)
  declare sortOrder?: SortOrder;
  
}
