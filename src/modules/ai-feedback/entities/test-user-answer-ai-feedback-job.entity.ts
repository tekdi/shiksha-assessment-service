import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AIFeedbackJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('testUserAnswerAIFeedbackJobs')
@Index('idx_ai_feedback_job_attempt', ['attemptId', 'tenantId'])
@Index('idx_ai_feedback_job_status', ['status'])
export class TestUserAnswerAIFeedbackJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid' })
  attemptAnsId: string;

  @Column({ type: 'uuid' })
  attemptId: string;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'text', default: AIFeedbackJobStatus.PENDING })
  status: AIFeedbackJobStatus;

  @Column({ type: 'text', nullable: true })
  rubricId: string;

  @Column({ type: 'text', nullable: true })
  agentId: string;

  @Column({ type: 'text', nullable: true })
  agentRequestId: string;

  @Column({ type: 'text', nullable: true })
  sessionObject: string;

  @Column({ type: 'text', nullable: true })
  devrevSessionId: string;

  @Column({ type: 'text', nullable: true })
  webhookId: string;

  @Column({ type: 'text', nullable: true })
  eventType: string;

  @Column({ type: 'text', nullable: true })
  lastProgressState: string;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  webhookReceived: boolean;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 0 })
  autoRetryCount: number;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
