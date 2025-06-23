import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minQuestions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxQuestions?: number;
} 