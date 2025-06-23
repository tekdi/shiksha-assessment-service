import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum QuestionType {
  MCQ = 'mcq',
  MULTIPLE_ANSWER = 'multiple_answer',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  MATCH = 'match',
  SUBJECTIVE = 'subjective',
  ESSAY = 'essay',
}

export enum QuestionLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum GradingType {
  QUIZ = 'quiz',
  EXERCISE = 'exercise',
}

export interface QuestionParams {
  maxLength?: number; // For text answers
  minLength?: number;
  allowAttachments?: boolean;
  wordLimit?: number;
  caseSensitive?: boolean;
  allowPartialScoring?: boolean;
  rubric?: {
    criteria: Array<{
      name: string;
      maxScore: number;
      description: string;
    }>;
  };
}

@Entity('questions')
export class Question {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  questionId: string;

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
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  alias: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ApiProperty({ enum: QuestionType })
  @Column({ type: 'text' })
  type: QuestionType;

  @ApiProperty({ enum: QuestionLevel })
  @Column({ type: 'text', default: QuestionLevel.MEDIUM })
  level: QuestionLevel;

  @ApiProperty()
  @Column({ type: 'integer', default: 1 })
  marks: number;

  @ApiProperty({ enum: QuestionStatus })
  @Column({ type: 'text', default: QuestionStatus.DRAFT })
  status: QuestionStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  idealTime: number;

  @ApiProperty({ enum: GradingType })
  @Column({ type: 'text', default: GradingType.QUIZ })
  gradingType: GradingType;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowPartialScoring: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  params: QuestionParams;

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
  @OneToMany('QuestionOption', 'question')
  options: any[];
} 