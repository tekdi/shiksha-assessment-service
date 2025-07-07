import { ApiProperty } from '@nestjs/swagger';
import { AttemptStatus, ReviewStatus } from '../entities/test-attempt.entity';
import { AttemptsGradeMethod } from '../entities/test.entity';

export class TestAttemptResultDto {
  @ApiProperty({
    description: 'Unique identifier for the test attempt',
    example: 'attempt-123e4567-e89b-12d3-a456-426614174000'
  })
  attemptId: string;

  @ApiProperty({
    description: 'Attempt number (1, 2, 3, etc.)',
    example: 1
  })
  attempt: number;

  @ApiProperty({
    description: 'Score achieved in this attempt',
    example: 85.5
  })
  score: number;

  @ApiProperty({
    description: 'Result of this attempt (P for Pass, F for Fail)',
    example: 'P',
    enum: ['P', 'F']
  })
  result: string;

  @ApiProperty({
    description: 'Current status of the attempt',
    enum: AttemptStatus,
    example: 'S'
  })
  status: AttemptStatus;

  @ApiProperty({
    description: 'Review status of the attempt',
    enum: ReviewStatus,
    example: 'R'
  })
  reviewStatus: ReviewStatus;

  @ApiProperty({
    description: 'Date and time when the attempt was submitted',
    example: '2024-01-15T10:30:00Z'
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'Time spent on this attempt in seconds',
    example: 1800
  })
  timeSpent: number;

  @ApiProperty({
    description: 'Whether this is the final attempt used for grading',
    example: true
  })
  isFinalAttempt: boolean;
}

export class TestInfoDto {
  @ApiProperty({
    description: 'Title of the test',
    example: 'JavaScript Fundamentals Assessment'
  })
  title: string;

  @ApiProperty({
    description: 'Minimum marks required to pass the test',
    example: 60
  })
  passingMarks: number;

  @ApiProperty({
    description: 'Total marks available in the test',
    example: 100
  })
  totalMarks: number;

  @ApiProperty({
    description: 'Whether the test contains only objective questions',
    example: true
  })
  isObjective: boolean;

  @ApiProperty({
    description: 'Whether correct answers are shown after submission',
    example: false
  })
  showCorrectAnswer: boolean;
}

export class TestResultDto {
  @ApiProperty({
    description: 'Unique identifier for the test',
    example: 'test-123e4567-e89b-12d3-a456-426614174000'
  })
  testId: string;

  @ApiProperty({
    description: 'Unique identifier for the user',
    example: 'user-123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    description: 'Final score calculated based on the grading method',
    example: 87.5
  })
  finalScore: number;

  @ApiProperty({
    description: 'Final result (P for Pass, F for Fail, null if pending review)',
    example: 'P',
    nullable: true
  })
  finalResult: string | null;

  @ApiProperty({
    description: 'Method used to calculate the final grade from multiple attempts',
    enum: AttemptsGradeMethod,
    example: 'LAST_ATTEMPT'
  })
  attemptsGrading: AttemptsGradeMethod;

  @ApiProperty({
    description: 'Array of all attempts made by the user for this test',
    type: [TestAttemptResultDto]
  })
  attempts: TestAttemptResultDto[];

  @ApiProperty({
    description: 'Basic information about the test',
    type: TestInfoDto
  })
  test: TestInfoDto;

  @ApiProperty({
    description: 'Whether there are any attempts pending review',
    example: false
  })
  hasPendingReview: boolean;
} 