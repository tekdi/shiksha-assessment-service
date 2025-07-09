import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from './test.entity';

export enum AttemptStatus {
  IN_PROGRESS = 'I',
  SUBMITTED = 'S',
}

export enum ReviewStatus {
  PENDING = 'P',
  UNDER_REVIEW = 'U',
  REVIEWED = 'R',
  NOT_APPLICABLE = 'N',
}

export enum SubmissionType {
  SELF = 'self',
  AUTO = 'auto',
}

export enum ResultType {
  PASS = 'P',
  FAIL = 'F',
}

@Entity('testAttempts')
export class TestAttempt {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  attemptId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  testId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  resolvedTestId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 1 })
  attempt: number;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  startedAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt: Date;

  @ApiProperty({ enum: AttemptStatus })
  @Column({ type: 'text', default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus;

  @ApiProperty({ enum: ReviewStatus })
  @Column({ type: 'text', default: ReviewStatus.NOT_APPLICABLE })
  reviewStatus: ReviewStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @ApiProperty({ enum: SubmissionType })
  @Column({ type: 'varchar', default: SubmissionType.SELF })
  submissionType: SubmissionType;

  @ApiProperty({ enum: ResultType, required: false })
  @Column({ type: 'text', nullable: true })
  result: ResultType;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  currentPosition: number;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  timeSpent: number;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Test, test => test.testId)
  @JoinColumn({ name: 'testId' })
  test: Test;
} 