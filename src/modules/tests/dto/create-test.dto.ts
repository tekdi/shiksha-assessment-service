import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID, IsDateString, IsNotEmpty, Validate } from 'class-validator';
import { TestType, TestStatus, GradingType, AttemptsGradeMethod } from '../entities/test.entity';
import { ValidateDatetimeConstraints } from '@/common/utils/helper.util';


export class CreateTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: TestType })
  @IsEnum(TestType)
  type: TestType;

  @ApiProperty()
  @IsNotEmpty({ message: 'Title is required' })
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
  @Validate(ValidateDatetimeConstraints)
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Validate(ValidateDatetimeConstraints)
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  answerSheet?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCorrectAnswer?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  printAnswersheet?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  questionsShuffle?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  answersShuffle?: boolean = true;

  @ApiPropertyOptional({ enum: GradingType })
  @IsNotEmpty()
  @IsEnum(GradingType)
  gradingType?: GradingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isObjective?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showThankyouPage?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAllQuestions?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paginationLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showQuestionsOverview?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Allow users to resubmit the same attempt multiple times. When true, users can only have one attempt and can submit it multiple times.',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  allowResubmission?: boolean;

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