import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from './test.entity';
import { TestSection } from './test-section.entity';

@Entity('testQuestions')
export class TestQuestion {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  testQuestionId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  testId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  ruleId: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isCompulsory: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isConditional: boolean;

  // Relations
  @ManyToOne(() => Test, test => test.questions)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @ManyToOne(() => TestSection, section => section.questions)
  @JoinColumn({ name: 'sectionId' })
  section: TestSection;

  @ManyToOne('Question')
  @JoinColumn({ name: 'questionId' })
  question: any;
} 