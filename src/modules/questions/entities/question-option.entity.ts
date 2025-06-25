import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Question, QuestionMedia } from './question.entity';

@Entity('questionOptions')
export class QuestionOption {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  questionOptionId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ 
    description: 'Option text content'
  })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ 
    required: false,
    description: 'Media URLs for the option',
    example: {
      image: "https://cdn.example.com/opt1.png",
      video: "https://cdn.example.com/opt2.mp4"
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  media: QuestionMedia;

  @ApiProperty({ 
    required: false,
    description: 'Text for matching (used in match questions)'
  })
  @Column({ type: 'text', nullable: true })
  matchWith: string;

  @ApiProperty({ 
    required: false,
    description: 'Media URLs for matching (used in match questions)',
    example: {
      image: "https://cdn.example.com/match1.png",
      video: "https://cdn.example.com/match2.mp4"
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  matchWithMedia: QuestionMedia;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  marks: number;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  blankIndex: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  caseSensitive: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Question, question => question.options)
  @JoinColumn({ name: 'questionId' })
  question: Question;
} 