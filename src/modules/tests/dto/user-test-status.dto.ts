import { ApiProperty } from '@nestjs/swagger';
import { AttemptStatus, ReviewStatus, ResultType } from '../entities/test-attempt.entity';
import { AttemptsGradeMethod } from '../entities/test.entity';

export class GradedAttemptDto {
  @ApiProperty({
    description: 'ID of the graded attempt',
    example: 'attempt-789',
  })
  attemptId: string;

  @ApiProperty({
    description: 'Status of the graded attempt',
    enum: AttemptStatus,
    example: 'S',
  })
  status: AttemptStatus;

  @ApiProperty({
    description: 'Score achieved in the graded attempt',
    example: 85,
  })
  score: number;

  @ApiProperty({
    description: 'Result of the graded attempt',
    enum: ResultType,
    example: 'P',
  })
  result: ResultType;

  @ApiProperty({
    description: 'When the attempt was submitted',
    example: '2025-07-14T10:15:00Z',
  })
  submittedAt: Date;
}

export class LastAttemptDto {
  @ApiProperty({
    description: 'ID of the last attempt',
    example: 'attempt-901',
  })
  attemptId: string;

  @ApiProperty({
    description: 'Status of the last attempt',
    enum: AttemptStatus,
    example: 'I',
  })
  status: AttemptStatus;

  @ApiProperty({
    description: 'Whether the attempt can be resumed',
    example: true,
  })
  resumeAllowed: boolean;
}

export class UserTestStatusDto {
  @ApiProperty({
    description: 'ID of the test',
    example: 'test-123',
  })
  testId: string;

  @ApiProperty({
    description: 'Total number of attempts allowed for this test',
    example: 3,
  })
  totalAttemptsAllowed: number;

  @ApiProperty({
    description: 'Number of attempts made by the user',
    example: 2,
  })
  attemptsMade: number;

  @ApiProperty({
    description: 'Whether the user can start a new attempt',
    example: true,
  })
  canAttempt: boolean;

  @ApiProperty({
    description: 'Whether the user can resume an existing attempt',
    example: false,
  })
  canResume: boolean;

  @ApiProperty({
    description: 'Grading method used for attempts',
    enum: AttemptsGradeMethod,
    example: 'highest',
  })
  attemptGrading: AttemptsGradeMethod;

  @ApiProperty({
    description: 'The graded attempt based on the grading method',
    type: GradedAttemptDto,
    required: false,
  })
  gradedAttempt: GradedAttemptDto | null;

  @ApiProperty({
    description: 'Information about the last attempt',
    type: LastAttemptDto,
    required: false,
  })
  lastAttempt: LastAttemptDto | null;

  @ApiProperty({
    description: 'Whether correct answers should be shown',
    example: false,
  })
  showCorrectAnswers: boolean;
} 