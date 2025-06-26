import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsEnum } from 'class-validator';
import { TestStatus } from '../entities/test.entity';
export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  testId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ordering?: number;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minQuestions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxQuestions?: number;
} 