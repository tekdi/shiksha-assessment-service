import { ApiProperty } from '@nestjs/swagger';
import { AttemptStatus, ReviewStatus, ResultType, SubmissionType } from '../../tests/entities/test-attempt.entity';
import { QuestionType } from '../../questions/entities/question.entity';
import { GradingType } from '../../tests/entities/test.entity';

export class QuestionOptionDto {
  @ApiProperty({
    description: 'Option ID',
    example: 'opt_123',
  })
  questionOptionId: string;

  @ApiProperty({
    description: 'Option text content',
    example: 'This is an option',
  })
  text: string;

  @ApiProperty({
    description: 'Media URLs for the option',
    required: false,
    example: {
      image: "https://cdn.example.com/opt1.png",
      video: "https://cdn.example.com/opt2.mp4"
    }
  })
  media?: any;

  @ApiProperty({
    description: 'Text for matching (used in match questions)',
    required: false,
  })
  matchWith?: string;

  @ApiProperty({
    description: 'Media URLs for matching (used in match questions)',
    required: false,
  })
  matchWithMedia?: any;

  @ApiProperty({
    description: 'Option ordering',
    example: 1,
  })
  ordering: number;

  @ApiProperty({
    description: 'Blank index for fill-in-the-blank questions',
    required: false,
  })
  blankIndex?: number;

  @ApiProperty({
    description: 'Whether the option is case sensitive',
    example: false,
  })
  caseSensitive: boolean;
}

export class UserAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'qstn_123',
  })
  questionId: string;

  @ApiProperty({
    description: 'Answer data in JSON format',
    example: { selectedOptionIds: ['opt_1'] },
  })
  answer: any;

  @ApiProperty({
    description: 'Score for this answer',
    required: false,
    example: 5,
  })
  score?: number;

  @ApiProperty({
    description: 'Review status',
    required: false,
  })
  reviewStatus?: string;

  @ApiProperty({
    description: 'Reviewer remarks',
    required: false,
  })
  remarks?: string;

  @ApiProperty({
    description: 'When the answer was submitted',
    example: '2024-01-15T10:35:00Z',
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'When the answer was last updated',
    example: '2024-01-15T10:35:00Z',
  })
  updatedAt: Date;
}

export class QuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'qstn_123',
  })
  questionId: string;

  @ApiProperty({
    description: 'Question text content',
    example: 'What is 2 + 2?',
  })
  text: string;

  @ApiProperty({
    description: 'Question description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Question type',
    enum: QuestionType,
    example: 'mcq',
  })
  type: QuestionType;

  @ApiProperty({
    description: 'Question difficulty level',
    example: 'medium',
  })
  level: string;

  @ApiProperty({
    description: 'Marks for this question',
    example: 5,
  })
  marks: number;

  @ApiProperty({
    description: 'Ideal time to answer in seconds',
    required: false,
  })
  idealTime?: number;

  @ApiProperty({
    description: 'Grading type',
    enum: GradingType,
    example: 'quiz',
  })
  gradingType: GradingType;

  @ApiProperty({
    description: 'Whether partial scoring is allowed',
    example: false,
  })
  allowPartialScoring: boolean;

  @ApiProperty({
    description: 'Question parameters',
    required: false,
  })
  params?: any;

  @ApiProperty({
    description: 'Media URLs for the question',
    required: false,
  })
  media?: any;

  @ApiProperty({
    description: 'Question ordering in the test',
    example: 1,
  })
  ordering: number;

  @ApiProperty({
    description: 'Whether this question is compulsory',
    example: false,
  })
  isCompulsory: boolean;

  @ApiProperty({
    description: 'Section ID this question belongs to',
    required: false,
  })
  sectionId?: string;

  @ApiProperty({
    description: 'Rule ID that generated this question',
    required: false,
  })
  ruleId?: string;

  @ApiProperty({
    description: 'Question options',
    type: [QuestionOptionDto],
  })
  options: QuestionOptionDto[];

  @ApiProperty({
    description: 'User answer for this question',
    required: false,
  })
  userAnswer?: UserAnswerDto | null;
}

export class SectionDto {
  @ApiProperty({
    description: 'Section ID',
    example: 'sec_123',
  })
  sectionId: string | null;

  @ApiProperty({
    description: 'Section title',
    example: 'Mathematics',
  })
  title: string;

  @ApiProperty({
    description: 'Section description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Section ordering',
    example: 1,
  })
  ordering: number;

  @ApiProperty({
    description: 'Minimum questions required in this section',
    required: false,
  })
  minQuestions?: number;

  @ApiProperty({
    description: 'Maximum questions allowed in this section',
    required: false,
  })
  maxQuestions?: number;

  @ApiProperty({
    description: 'Questions in this section',
    type: [QuestionDto],
  })
  questions: QuestionDto[];
}

export class ProgressDto {
  @ApiProperty({
    description: 'Total number of questions',
    example: 20,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of answered questions',
    example: 15,
  })
  answeredQuestions: number;

  @ApiProperty({
    description: 'Progress percentage',
    example: 75,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Number of remaining questions',
    example: 5,
  })
  remainingQuestions: number;
}

export class AttemptDetailsDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 'attempt_abc123',
  })
  attemptId: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_456',
  })
  userId: string;

  @ApiProperty({
    description: 'Attempt number',
    example: 1,
  })
  attempt: number;

  @ApiProperty({
    description: 'Attempt status',
    enum: AttemptStatus,
    example: 'I',
  })
  status: AttemptStatus;

  @ApiProperty({
    description: 'Review status',
    enum: ReviewStatus,
    example: 'N',
  })
  reviewStatus: ReviewStatus;

  @ApiProperty({
    description: 'Submission type',
    enum: SubmissionType,
    example: 'self',
  })
  submissionType: SubmissionType;

  @ApiProperty({
    description: 'Result type',
    enum: ResultType,
    required: false,
    example: null,
  })
  result: ResultType | null;

  @ApiProperty({
    description: 'Score',
    required: false,
    example: null,
  })
  score: number | null;

  @ApiProperty({
    description: 'Current position in test',
    required: false,
    example: 5,
  })
  currentPosition: number | null;

  @ApiProperty({
    description: 'Time spent in seconds',
    required: false,
    example: 1800,
  })
  timeSpent: number | null;

  @ApiProperty({
    description: 'When the attempt was started',
    example: '2024-01-15T10:30:00Z',
  })
  startedAt: Date;

  @ApiProperty({
    description: 'When the attempt was submitted',
    required: false,
    example: null,
  })
  submittedAt: Date | null;

  @ApiProperty({
    description: 'Progress information',
    type: ProgressDto,
  })
  progress: ProgressDto;

  @ApiProperty({
    description: 'Time remaining in seconds',
    required: false,
    example: 1800,
  })
  timeRemaining: number | null;
}

export class ResumeAttemptDto {
  @ApiProperty({
    description: 'Test ID',
    example: 'test_123',
  })
  testId: string;

  @ApiProperty({
    description: 'Resolved test ID (for rule-based tests)',
    required: false,
    example: 'test_generated_456',
  })
  resolvedTestId?: string;

  @ApiProperty({
    description: 'Test title',
    example: 'Mathematics Quiz',
  })
  title: string;

  @ApiProperty({
    description: 'Test description',
    example: 'Basic mathematics assessment',
  })
  description: string | null;

  @ApiProperty({
    description: 'Total marks for the test',
    example: 100,
  })
  totalMarks: number;

  @ApiProperty({
    description: 'Time duration in seconds',
    example: 3600,
  })
  timeDuration: number | null;

  @ApiProperty({
    description: 'Whether to show time',
    example: true,
  })
  showTime: boolean;

  @ApiProperty({
    description: 'Test type',
    example: 'plain',
  })
  type: string;

  @ApiProperty({
    description: 'Passing marks',
    example: 60,
  })
  passingMarks: number;

  @ApiProperty({
    description: 'Whether to show correct answers',
    example: false,
  })
  showCorrectAnswer: boolean;

  @ApiProperty({
    description: 'Whether to show questions overview',
    example: true,
  })
  showQuestionsOverview: boolean;

  @ApiProperty({
    description: 'Whether to shuffle questions',
    example: false,
  })
  questionsShuffle: boolean;

  @ApiProperty({
    description: 'Whether to shuffle answers',
    example: false,
  })
  answersShuffle: boolean;

  @ApiProperty({
    description: 'Pagination limit',
    required: false,
  })
  paginationLimit?: number;

  @ApiProperty({
    description: 'Whether to show thank you page',
    example: false,
  })
  showThankyouPage: boolean;

  @ApiProperty({
    description: 'Whether to show all questions',
    example: true,
  })
  showAllQuestions: boolean;

  @ApiProperty({
    description: 'Whether to show answer sheet',
    example: false,
  })
  answerSheet: boolean;

  @ApiProperty({
    description: 'Whether to allow printing answer sheet',
    example: false,
  })
  printAnswersheet: boolean;

  @ApiProperty({
    description: 'Attempt details',
    type: AttemptDetailsDto,
  })
  attempt: AttemptDetailsDto;

  @ApiProperty({
    description: 'Test sections with questions',
    type: [SectionDto],
  })
  sections: SectionDto[];
} 