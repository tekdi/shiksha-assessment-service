import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/base.dto';

export class QuestionAnswerReportDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Number of records per page',
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    default: 0,
    minimum: 0
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
} 