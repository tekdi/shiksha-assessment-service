import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID, IsDateString, Validate, ValidateIf } from 'class-validator';
import { ValidateDatetimeConstraints } from '@/common/utils/helper.util';
import { TestType, TestStatus, GradingType, AttemptsGradeMethod } from '../entities/test.entity';

export class CreateTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: TestType })
  @IsEnum(TestType)
  type: TestType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewers?: string;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showTime?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showTimeFinished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeFinishedDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  passingMarks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Validate(ValidateDatetimeConstraints)
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  answerSheet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCorrectAnswer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  printAnswersheet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  questionsShuffle?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  answersShuffle?: boolean;

  @ApiPropertyOptional({ enum: GradingType })
  @IsOptional()
  @IsEnum(GradingType)
  gradingType?: GradingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isObjective?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showThankyouPage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAllQuestions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paginationLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showQuestionsOverview?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ordering?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  attempts?: number;

  @ApiPropertyOptional({ enum: AttemptsGradeMethod })
  @IsOptional()
  @IsEnum(AttemptsGradeMethod)
  attemptsGrading?: AttemptsGradeMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  checkedOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkedOutTime?: string;
} 