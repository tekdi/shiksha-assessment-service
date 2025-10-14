import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionOption } from './question-option.entity';
import { GradingType } from '../../tests/entities/test.entity';

export enum QuestionType {
  MCQ = 'mcq',
  MULTIPLE_ANSWER = 'multiple_answer',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  MATCH = 'match',
  SUBJECTIVE = 'subjective', //short answer, requires manual review and scoring
  ESSAY = 'essay', //long answer, requires manual review and scoring
  DROPDOWN = 'dropdown', //dropdown selection question
  RATING = 'rating', //star rating question
  CHECKBOX = 'checkbox', //checkbox question
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

export interface QuestionMedia {
  image?: string;
  video?: string;
  audio?: string;
  document?: string;
}

export interface QuestionParams {
  maxLength?: number; // For text answers
  minLength?: number;
  allowAttachments?: boolean;
  wordLimit?: number;
  caseSensitive?: boolean;
  allowPartialScoring?: boolean;
  // Rating-specific parameters
  ratingScale?: {
    min: number;           // Minimum rating value (default: 1)
    max: number;           // Maximum rating value (default: 5)
    step?: number;         // Step increment (default: 1)
    showLabels?: boolean;  // Whether to show labels (labels stored in options)
    scoringStrategy?: 'full_marks' | 'proportional' | 'threshold' | 'target_rating'; // Scoring strategy
    threshold?: number;    // Threshold for threshold scoring strategy
    targetRating?: number; // Target rating for target_rating scoring strategy
  };
  // Dropdown-specific parameters
  dropdownConfig?: {
    allowMultiple?: boolean;    // Allow multiple selections
    searchable?: boolean;       // Enable search functionality
    placeholder?: string;       // Placeholder text
  };
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

  @ApiProperty({ 
    description: 'Question text content'
  })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ 
    required: false,
    description: 'Media URLs for the question',
    example: {
      image: "https://cdn.example.com/question.png",
      video: "https://cdn.example.com/question.mp4"
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  media: QuestionMedia;

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
  @OneToMany(() => QuestionOption, option => option.question)
  options: QuestionOption[];

  // Alias for compatibility with existing code
  get id(): string {
    return this.questionId;
  }

  // Backward compatibility getter for title
  get title(): string {
    return this.text || '';
  }
} 