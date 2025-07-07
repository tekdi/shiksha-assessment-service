import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsBoolean, IsArray, IsOptional, IsUUID, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttemptStatus, ReviewStatus, ResultType } from '../../tests/entities/test-attempt.entity';
import { QuestionType } from '../../questions/entities/question.entity';

export class TestInfoDto {
  @ApiProperty({
    description: 'Title of the test',
    example: 'Mathematics Final Exam'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Minimum marks required to pass the test',
    example: 60
  })
  @IsNumber()
  passingMarks: number;

  @ApiProperty({
    description: 'Total marks available in the test',
    example: 100
  })
  @IsNumber()
  totalMarks: number;

  @ApiProperty({
    description: 'Whether the test contains only objective questions',
    example: true
  })
  @IsBoolean()
  isObjective: boolean;
}

export class SelectedOptionDto {
  @ApiProperty({
    description: 'ID of the selected option',
    example: 'option-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionOptionId: string;

  @ApiProperty({
    description: 'Text content of the selected option',
    example: 'Option A'
  })
  @IsString()
  text: string;
}

export class FillBlankAnswerDto {
  @ApiProperty({
    description: 'Index of the blank in the question',
    example: 1
  })
  @IsNumber()
  blankIndex: number;

  @ApiProperty({
    description: 'User\'s answer for this blank',
    example: 'answer'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Correct answer for this blank',
    example: 'correct_answer'
  })
  @IsString()
  correctText: string;

  @ApiProperty({
    description: 'Whether the answer is case sensitive',
    example: false
  })
  @IsBoolean()
  caseSensitive: boolean;
}

export class MatchAnswerDto {
  @ApiProperty({
    description: 'ID of the option being matched',
    example: 'option-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionOptionId: string;

  @ApiProperty({
    description: 'Text of the option being matched',
    example: 'Capital of France'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'ID of the option it was matched with',
    example: 'option-456e7890-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  matchWith: string;

  @ApiProperty({
    description: 'Text of the option it was matched with',
    example: 'Paris'
  })
  @IsString()
  matchWithText: string;
}

export class CorrectOptionDto {
  @ApiProperty({
    description: 'ID of the correct option',
    example: 'option-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionOptionId: string;

  @ApiProperty({
    description: 'Text content of the correct option',
    example: 'Correct Answer'
  })
  @IsString()
  text: string;
}

export class AttemptAnswerDto {
  @ApiProperty({
    description: 'ID of the question',
    example: 'question-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Text content of the question',
    example: 'What is 2 + 2?'
  })
  @IsString()
  questionText: string;

  @ApiProperty({
    description: 'Type of the question',
    enum: QuestionType,
    example: QuestionType.MCQ
  })
  @IsEnum(QuestionType)
  questionType: string;

  @ApiProperty({
    description: 'Maximum marks for this question',
    example: 5
  })
  @IsNumber()
  marks: number;

  @ApiProperty({
    description: 'Score obtained for this question',
    example: 5
  })
  @IsNumber()
  score: number;

  @ApiProperty({
    description: 'Review status of this answer',
    example: 'R'
  })
  @IsString()
  reviewStatus: string;

  @ApiPropertyOptional({
    description: 'Remarks from the reviewer',
    example: 'Good answer'
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'ID of the reviewer',
    example: 'reviewer-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @ApiPropertyOptional({
    description: 'When the answer was reviewed',
    example: '2023-11-02T10:33:23.321Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reviewedAt?: Date;

  @ApiPropertyOptional({
    description: 'User\'s selected options (for MCQ, True-False, Multiple Answer, Fill Blank, Match)',
    type: [SelectedOptionDto],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptionIds?: SelectedOptionDto[];

  @ApiPropertyOptional({
    description: 'User\'s text answer (for Subjective/Essay questions)',
    example: 'This is my detailed answer to the essay question.'
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Correct options for this question (only shown if showCorrectAnswer is enabled)',
    type: [CorrectOptionDto],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectOptionDto)
  correctOptions?: CorrectOptionDto[];
}

export class AttemptResultDto {
  @ApiProperty({
    description: 'ID of the attempt',
    example: 'attempt-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  attemptId: string;

  @ApiProperty({
    description: 'ID of the test',
    example: 'test-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  testId: string;

  @ApiProperty({
    description: 'ID of the user who took the test',
    example: 'user-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Status of the attempt',
    enum: AttemptStatus,
    example: AttemptStatus.SUBMITTED
  })
  @IsEnum(AttemptStatus)
  status: AttemptStatus;

  @ApiProperty({
    description: 'Review status of the attempt',
    enum: ReviewStatus,
    example: ReviewStatus.REVIEWED
  })
  @IsEnum(ReviewStatus)
  reviewStatus: ReviewStatus;

  @ApiProperty({
    description: 'Total score obtained in the test',
    example: 85
  })
  @IsNumber()
  score: number;

  @ApiProperty({
    description: 'Result of the test (PASS/FAIL)',
    enum: ResultType,
    example: ResultType.PASS
  })
  @IsEnum(ResultType)
  result: ResultType;

  @ApiProperty({
    description: 'When the attempt was submitted',
    example: '2023-11-02T10:33:23.321Z'
  })
  @IsDate()
  @Type(() => Date)
  submittedAt: Date;

  @ApiProperty({
    description: 'Time spent on the test in seconds',
    example: 3600
  })
  @IsNumber()
  timeSpent: number;

  @ApiProperty({
    description: 'Information about the test',
    type: TestInfoDto
  })
  @ValidateNested()
  @Type(() => TestInfoDto)
  test: TestInfoDto;

  @ApiProperty({
    description: 'Array of answers with question details',
    type: [AttemptAnswerDto],
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerDto)
  attempt: AttemptAnswerDto[];
} 