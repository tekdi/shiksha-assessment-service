import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from './test.entity';
import { TestSection } from './test-section.entity';
import { TestRule } from './test-rule.entity';

@Entity('questionPools')
export class QuestionPool {
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
  testId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  ruleId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  questionIds: string[];

  @ApiProperty()
  @Column({ type: 'integer' })
  totalQuestions: number;

  @ApiProperty()
  @Column({ type: 'integer' })
  totalMarks: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ type: 'timestamp with time zone' })
  generatedAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

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
  @ManyToOne(() => Test, test => test.testId)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @ManyToOne(() => TestSection, section => section.sectionId)
  @JoinColumn({ name: 'sectionId' })
  section: TestSection;

  @ManyToOne(() => TestRule, rule => rule.id)
  @JoinColumn({ name: 'ruleId' })
  rule: TestRule;
} 