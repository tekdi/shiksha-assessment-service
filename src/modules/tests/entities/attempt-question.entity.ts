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
import { TestAttempt } from './test-attempt.entity';

@Entity('attemptQuestions')
export class AttemptQuestion {
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
  attemptId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  questionOrder: number;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  ruleId: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  marks: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isCompulsory: boolean;

  @ApiProperty()
  @Column({ type: 'timestamp with time zone' })
  servedAt: Date;

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
  @ManyToOne(() => TestAttempt, attempt => attempt.attemptId)
  @JoinColumn({ name: 'attemptId' })
  attempt: TestAttempt;
} 