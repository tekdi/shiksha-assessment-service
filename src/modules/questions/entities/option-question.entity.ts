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
import { QuestionOption } from './question-option.entity';
import { Question } from './question.entity';

@Entity('optionQuestions')
export class OptionQuestion {
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
  optionId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => QuestionOption, option => option.optionQuestions)
  @JoinColumn({ name: 'optionId' })
  option: QuestionOption;

  @ManyToOne(() => Question, question => question.optionQuestions)
  @JoinColumn({ name: 'questionId' })
  question: Question;
}