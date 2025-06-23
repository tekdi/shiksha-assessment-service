import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Question } from './question.entity';

@Entity('questionOptions')
export class QuestionOption {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  matchWith: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  position: number;

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