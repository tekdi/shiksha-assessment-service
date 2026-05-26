import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  DevRevExecuteAsyncPayload,
  QuestionContext,
} from './interfaces/ai-feedback.interface';
import { TestUserAnswerAIFeedbackJob } from './entities/test-user-answer-ai-feedback-job.entity';

const PROMPT_VERSION = 'v1';

@Injectable()
export class DevRevService {
  private readonly logger = new Logger(DevRevService.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly agentId: string;
  private readonly webhookId: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'DEVREV_BASE_URL',
      'https://api.devrev.ai/internal',
    );
    this.apiToken = this.configService.get<string>('DEVREV_API_TOKEN', '');
    this.agentId = this.configService.get<string>('DEVREV_AGENT_ID', '');
    this.webhookId = this.configService.get<string>('DEVREV_WEBHOOK_ID', '');

    if (!this.apiToken || !this.agentId || !this.webhookId) {
      this.logger.warn(
        'DEVREV_API_TOKEN, DEVREV_AGENT_ID or DEVREV_WEBHOOK_ID not set — AI feedback will not work',
      );
    } else {
      this.logger.log(`DevRev service ready. Agent: ${this.agentId}, Webhook: ${this.webhookId}`);
    }
  }

  buildPrompt(ctx: QuestionContext): string {
    return (
      `${ctx.answer}`
    );
  }

  async executeAssessmentFeedbackAgent(
    job: TestUserAnswerAIFeedbackJob,
    questionContext: QuestionContext,
  ): Promise<{ requestPayload: DevRevExecuteAsyncPayload; agentRequestId?: string }> {
    if (!this.webhookId) {
      throw new Error(
        'DevRev webhook is not active. Ensure ngrok is running before starting the service, ' +
        'or set DEVREV_WEBHOOK_ID in .env.',
      );
    }

    const sessionObject = `${job.attemptId}_${job.questionId}`;
    const message = this.buildPrompt(questionContext);

    const payload: DevRevExecuteAsyncPayload = {
      agent: this.agentId,
      event: {
        input_message: { message },
      },
      session_object: sessionObject,
      webhook_target: { webhook: this.webhookId },
      client_metadata: {
        attemptAnsId: job.attemptAnsId,
        attemptId: job.attemptId,
        questionId: job.questionId,
        jobId: job.id,
        rubric_id: job.rubricId,
      },
    };

    this.logger.log(
      `Executing DevRev async agent for job ${job.id}, session ${sessionObject}`,
    );
    this.logger.log(
      `DevRev request payload: ${JSON.stringify(payload, null, 2)}`,
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/ai-agents.events.execute-async`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiToken}`,
          },
          timeout: 30_000,
        },
      );

      this.logger.log(
        `DevRev response [${response.status}]: ${JSON.stringify(response.data, null, 2)}`,
      );

      return {
        requestPayload: { ...payload, promptVersion: PROMPT_VERSION } as any,
        agentRequestId: response.data?.request_id || response.data?.id,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `DevRev API error [${error.response?.status}]: ${JSON.stringify(error.response?.data, null, 2)}`,
        );
        this.logger.error(
          `DevRev request that failed: ${JSON.stringify(payload, null, 2)}`,
        );
      }
      throw error;
    }
  }

  get promptVersion(): string {
    return PROMPT_VERSION;
  }

  get configuredAgentId(): string {
    return this.agentId;
  }

  get configuredWebhookId(): string {
    return this.webhookId;
  }
}
