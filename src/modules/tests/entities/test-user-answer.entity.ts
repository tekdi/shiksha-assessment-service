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
import { TestAttempt } from './test-attempt.entity';

export enum ReviewStatus {
  PENDING = 'P',
  REVIEWED = 'R',
}

@Entity('testUserAnswers')
export class TestUserAnswer {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  attemptAnsId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  attemptId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  answer: string; // JSON string containing the answer structure

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @ApiProperty({ enum: ReviewStatus })
  @Column({ type: 'text', default: ReviewStatus.PENDING })
  reviewStatus: ReviewStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  remarks: string; // Reviewer comments

  @ApiProperty()
  @Column({ type: 'text' })
  anssOrder: string; // Order of answers

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
  @ManyToOne(() => TestAttempt, attempt => attempt.attemptId)
  @JoinColumn({ name: 'attemptId' })
  attempt: TestAttempt;
} 