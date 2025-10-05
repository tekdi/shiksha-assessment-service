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
import { QuestionOption } from './question-option.entity';
import { OptionQuestion } from './option-question.entity';
import { GradingType } from '../../tests/entities/test.entity';

export enum QuestionType {
  MCQ = 'mcq',
  MULTIPLE_ANSWER = 'multiple_answer',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  MATCH = 'match',
  SUBJECTIVE = 'subjective', //short answer, requires manual review and scoring
  ESSAY = 'essay', //long answer, requires manual review and scoring
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
  parentId: string;

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

  @ManyToOne(() => Question, question => question.childQuestions)
  @JoinColumn({ name: 'parentId' })
  parent: Question;

  @OneToMany(() => Question, question => question.parent)
  childQuestions: Question[];

  @OneToMany(() => OptionQuestion, optionQuestion => optionQuestion.question)
  optionQuestions: OptionQuestion[];

  // Alias for compatibility with existing code
  get id(): string {
    return this.questionId;
  }

  // Backward compatibility getter for title
  get title(): string {
    return this.text || '';
  }
} 