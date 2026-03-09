import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { QueryTestDto } from './query-test.dto';

export class SearchTestDto extends QueryTestDto {
  @ApiPropertyOptional({ description: 'Filter tests created on or after this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter tests created on or before this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
