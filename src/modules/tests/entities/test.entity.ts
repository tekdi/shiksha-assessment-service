import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TestSection } from './test-section.entity';
import { TestQuestion } from './test-question.entity';
import { TestAttempt } from './test-attempt.entity';

export enum TestType {
  PLAIN = 'plain',
  RULE_BASED = 'rule_based',
  GENERATED = 'generated',
}

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNPUBLISHED = 'unpublished',
  ARCHIVED = 'archived',
}

export enum GradingType {
  QUIZ = 'quiz',
  ASSESSMENT = 'assessment',
  REFLECTION_PROMPT = 'reflection.prompt', // PROJECT SPECIFIC - ASPRE_LEADER
  FEEDBACK = 'feedback',
}

/** Grading types that may include `QuestionType.FILE` (feedback / reflection / assessment tests). */
export const GRADING_TYPES_ALLOWING_FILE_QUESTION: ReadonlySet<GradingType> = new Set([
  GradingType.FEEDBACK,
  GradingType.REFLECTION_PROMPT,
  GradingType.ASSESSMENT,
]);

export function allowsFileTypeQuestion(
  gradingType: string | GradingType | undefined | null,
): boolean {
  if (gradingType == null || gradingType === '') return false;
  return GRADING_TYPES_ALLOWING_FILE_QUESTION.has(gradingType as GradingType);
}

/**
 * Feedback & reflection tests: skip strict option rules on create, form-style compulsory check, no pass/fail on submit.
 * Not used for `assessment` (graded tests still validate options and score normally).
 */
export const FORM_STYLE_TEST_GRADING_TYPES: ReadonlySet<GradingType> = new Set([
  GradingType.FEEDBACK,
  GradingType.REFLECTION_PROMPT,
  GradingType.ASSESSMENT,
]);

export function isFormStyleTestGrading(
  gradingType: string | GradingType | undefined | null,
): boolean {
  if (gradingType == null || gradingType === '') return false;
  return FORM_STYLE_TEST_GRADING_TYPES.has(gradingType as GradingType);
}
export enum AttemptsGradeMethod {
  FIRST_ATTEMPT = 'first_attempt',
  LAST_ATTEMPT = 'last_attempt',
  AVERAGE = 'average',
  HIGHEST = 'highest',
}


@Entity('tests')
@Index('idx_test_context', ['contextType', 'contextId'])
export class Test {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  testId:string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ApiProperty({ enum: TestType })
  @Column({ type: 'varchar', length: 255 })
  type: TestType;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @ApiProperty()
  @Column({ type: 'integer', default: 1 })
  attempts: number;

  @ApiProperty({ enum: AttemptsGradeMethod })
  @Column({ type: 'text', default: AttemptsGradeMethod.LAST_ATTEMPT })
  attemptsGrading: AttemptsGradeMethod;

  @ApiProperty({ enum: TestStatus })
  @Column({ type: 'text', default: TestStatus.DRAFT })
  status: TestStatus;

  @ApiProperty()
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  alias: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reviewers: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showTime: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  timeDuration: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showTimeFinished: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  timeFinishedDuration: number;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  totalMarks: number;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  passingMarks: number;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  image: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate: Date;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  answerSheet: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showCorrectAnswer: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  printAnswersheet: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  questionsShuffle: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  answersShuffle: boolean;

  @ApiProperty({ enum: GradingType })
  @Column({ type: 'text', default: GradingType.QUIZ })
  gradingType: GradingType;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isObjective: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showThankyouPage: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showAllQuestions: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  paginationLimit: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  showQuestionsOverview: boolean;

  @ApiProperty({ 
    description: 'Allow users to resubmit the same attempt multiple times. When true, users can only have one attempt and can submit it multiple times.',
    default: false 
  })
  @Column({ type: 'boolean', default: false })
  allowResubmission: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  checkedOut: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  checkedOutTime: Date;

  @ApiProperty({ required: false, description: 'Context type e.g. PATHWAY, EVENT' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  contextType: string | null;

  @ApiProperty({ required: false, description: 'Context id (pathway or event UUID)' })
  @Column({ type: 'uuid', nullable: true })
  contextId: string | null;

  @ApiProperty()
  @Column({ type: 'uuid' })
  createdBy: string;

  @ApiProperty()
  @Index('idx_test_created_at')
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TestSection, (section: TestSection) => section.test)
  sections: TestSection[];

  @OneToMany(() => TestQuestion, (question: TestQuestion) => question.test)
  questions: TestQuestion[];

  @OneToMany(() => TestAttempt, (attempt: TestAttempt) => attempt.test)
  testAttempts: TestAttempt[];

  @ManyToOne(() => Test, test => test.testId)
  @JoinColumn({ name: 'parentId' })
  parent: Test;

  // Alias for compatibility with existing code
  get id(): string {
    return this.testId;
  }
}
