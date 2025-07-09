import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
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
  ASSIGNMENT = 'assignment',
  FEEDBACK = 'feedback',
}
export enum AttemptsGradeMethod {
  FIRST_ATTEMPT = 'first_attempt',
  LAST_ATTEMPT = 'last_attempt',
  AVERAGE = 'average',
  HIGHEST = 'highest',
}


@Entity('tests')
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

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  checkedOut: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  checkedOutTime: Date;

  @ApiProperty()
  @Column({ type: 'uuid' })
  createdBy: string;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TestSection, section => section.test)
  sections: TestSection[];

  @OneToMany(() => TestQuestion, question => question.test)
  questions: TestQuestion[];

  @OneToMany(() => TestAttempt, attempt => attempt.test)
  testAttempts: TestAttempt[];

  @ManyToOne(() => Test, test => test.sections)
  @JoinColumn({ name: 'parentId' })
  parent: Test;

  // Alias for compatibility with existing code
  get id(): string {
    return this.testId;
  }
} 