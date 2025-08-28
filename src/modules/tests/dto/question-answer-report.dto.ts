import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/base.dto';

export class QuestionAnswerReportDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Array of user IDs to filter the report. If empty or not provided, returns data for all users.',
    type: [String],
    example: ['100ba777-ca99-4cea-8ec7-c1ddd763d97b', '1873de9c-4a1d-4e2b-9b8a-edd570480dd5']
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

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