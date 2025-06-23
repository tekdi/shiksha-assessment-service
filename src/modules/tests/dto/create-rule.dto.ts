import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsBoolean, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { RuleType, SelectionStrategy } from '../entities/test-rule.entity';

export class RuleCriteriaDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficultyLevels?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  excludeQuestionIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  includeQuestionIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  timeRange?: {
    from: Date;
    to: Date;
  };
}

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RuleType })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  testId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiProperty()
  @IsNumber()
  numberOfQuestions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxMarks?: number;

  @ApiPropertyOptional({ enum: SelectionStrategy })
  @IsOptional()
  @IsEnum(SelectionStrategy)
  selectionStrategy?: SelectionStrategy;

  @ApiProperty()
  @ValidateNested()
  @Type(() => RuleCriteriaDto)
  criteria: RuleCriteriaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;
} 