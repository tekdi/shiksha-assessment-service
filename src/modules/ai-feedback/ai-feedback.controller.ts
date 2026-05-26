import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AiFeedbackService } from './ai-feedback.service';
import { AiFeedbackJobService } from './ai-feedback-job.service';
import { AuthContextInterceptor } from '../../common/interceptors/auth-context.interceptor';
import { DevRevWebhookEvent } from './interfaces/ai-feedback.interface';
import {
  AiFeedbackStatusResponseDto,
  AiFeedbackResponseDto,
} from './dto/ai-feedback.dto';

@ApiTags('AI Feedback')
@Controller()
export class AiFeedbackController {
  private readonly logger = new Logger(AiFeedbackController.name);

  constructor(
    private readonly aiFeedbackService: AiFeedbackService,
    private readonly jobService: AiFeedbackJobService,
  ) {}

  // ── DevRev Webhook ────────────────────────────────────────────────────────────

  @Post('ai-feedback/devrev/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'DevRev async agent webhook handler',
    description:
      'Receives progress, message, and error events from the DevRev async AI agent.',
  })
  @ApiResponse({ status: 200, description: 'Event acknowledged' })
  async handleDevRevWebhook(@Body() body: any, @Res() res: Response): Promise<void> {
    // Log every incoming request — headers + full body for debugging
    this.logger.log(`[webhook] Incoming POST /ai-feedback/devrev/webhook`);
    this.logger.log(`[webhook] Raw body: ${JSON.stringify(body, null, 2)}`);

    // DevRev verify handshake — must respond with raw { challenge } at top level
    // bypassing the global ApiResponseInterceptor which would wrap it
    if (body?.type === 'verify' && body?.verify?.challenge) {
      this.logger.log(`[webhook] Verify challenge received: ${body.verify.challenge}`);
      this.logger.log(`[webhook] Responding with: ${JSON.stringify({ challenge: body.verify.challenge })}`);
      res.status(200).json({ challenge: body.verify.challenge });
      return;
    }

    const agentResponse = (body as DevRevWebhookEvent)?.ai_agent_response;
    if (!agentResponse) {
      this.logger.warn(`[webhook] No ai_agent_response in body. Keys received: ${Object.keys(body || {}).join(', ')}`);
      res.status(200).json({ received: true });
      return;
    }

    const { agent_response: eventType, session_object: session } = agentResponse;
    this.logger.log(
      `[webhook] Agent event: type=${eventType}, session=${session}, jobId=${agentResponse.client_metadata?.jobId}`,
    );

    try {
      switch (eventType) {
        case 'progress':
          await this.jobService.handleProgressEvent(agentResponse);
          break;

        case 'message':
          await this.jobService.handleMessageEvent(agentResponse);
          break;

        case 'error':
          await this.jobService.handleErrorEvent(agentResponse);
          break;

        default:
          this.logger.warn(`[webhook] Unknown event type: ${eventType}`);
      }
    } catch (err) {
      // Always return 200 to DevRev — retries won't help a processing error
      this.logger.error(`[webhook] Error processing ${eventType} event for job ${agentResponse.client_metadata?.jobId}: ${err?.message}`, err?.stack);
    }

    res.status(200).json({ received: true });
  }

  // ── Assessment AI Feedback Status ─────────────────────────────────────────────

  @ApiBearerAuth()
  @UseInterceptors(AuthContextInterceptor)
  @Get('assessment/:attemptId/ai-feedback-status')
  @ApiOperation({ summary: 'Get AI feedback job status for an attempt' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({
    status: 200,
    description: 'AI feedback job status',
    type: AiFeedbackStatusResponseDto,
  })
  async getAiFeedbackStatus(
    @Param('attemptId') attemptId: string,
    @Req() req: any,
  ): Promise<AiFeedbackStatusResponseDto> {
    return this.aiFeedbackService.getAiFeedbackStatus(attemptId, req.user);
  }

  // ── Assessment AI Feedback Results ────────────────────────────────────────────

  @ApiBearerAuth()
  @UseInterceptors(AuthContextInterceptor)
  @Get('assessment/:attemptId/ai-feedback')
  @ApiOperation({
    summary: 'Get AI feedback results for an attempt',
    description: 'Returns learner answers with AI score, feedback, and review status.',
  })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({
    status: 200,
    description: 'AI feedback results',
    type: AiFeedbackResponseDto,
  })
  async getAiFeedback(
    @Param('attemptId') attemptId: string,
    @Req() req: any,
  ): Promise<AiFeedbackResponseDto> {
    return this.aiFeedbackService.getAiFeedback(attemptId, req.user);
  }

  // ── Retry Failed Jobs ─────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseInterceptors(AuthContextInterceptor)
  @Post('assessment/:attemptId/ai-feedback/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry failed AI feedback jobs for an attempt' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({ status: 200, description: 'Retry results' })
  async retryFailedJobs(
    @Param('attemptId') attemptId: string,
    @Req() req: any,
  ): Promise<{ retried: number }> {
    return this.aiFeedbackService.retryFailedJobs(attemptId, req.user);
  }
}
