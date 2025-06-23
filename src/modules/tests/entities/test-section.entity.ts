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
import { TestQuestion } from './test-question.entity';

@Entity('testSections')
export class TestSection {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  sectionId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  organisationId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  testId: string;

  @ApiProperty()
  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @ApiProperty()
  @Column({ type: 'text', default: 'active' })
  status: string;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  minQuestions: number;

  @ApiProperty({ required: false })
  @Column({ type: 'integer', nullable: true })
  maxQuestions: number;

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
  @ManyToOne(() => Test, test => test.sections)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @OneToMany(() => TestQuestion, question => question.section)
  questions: TestQuestion[];
} 