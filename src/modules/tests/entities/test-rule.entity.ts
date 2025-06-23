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
import { TestSection } from './test-section.entity';

export enum RuleType {
  CATEGORY_BASED = 'category_based',
  DIFFICULTY_BASED = 'difficulty_based',
  TYPE_BASED = 'type_based',
  MIXED = 'mixed',
}

export enum SelectionStrategy {
  RANDOM = 'random',
  SEQUENTIAL = 'sequential',
  WEIGHTED = 'weighted',
}

@Entity('testRules')
export class TestRule {
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
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: RuleType })
  @Column({ type: 'text' })
  ruleType: RuleType;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  testId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  numberOfQuestions: number;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  minMarks: number;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  maxMarks: number;

  @ApiProperty({ enum: SelectionStrategy })
  @Column({ type: 'text', default: SelectionStrategy.RANDOM })
  selectionStrategy: SelectionStrategy;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  criteria: {
    categories?: string[];
    difficultyLevels?: string[];
    questionTypes?: string[];
    tags?: string[];
    excludeQuestionIds?: string[];
    includeQuestionIds?: string[];
    timeRange?: {
      from: Date;
      to: Date;
    };
  };

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  priority: number;

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
  @ManyToOne(() => Test, test => test.id)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @ManyToOne(() => TestSection, section => section.id)
  @JoinColumn({ name: 'sectionId' })
  section: TestSection;
} 