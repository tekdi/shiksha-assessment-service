import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';

@ApiTags('Test Attempts')
@ApiBearerAuth()
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start/:testId')
  @ApiOperation({ summary: 'Start a new test attempt' })
  @ApiResponse({ status: 201, description: 'Attempt started', type: ApiSuccessResponseDto })
  async startAttempt(@Param('testId') testId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.startAttempt(testId, authContext.userId, authContext);
    return { attemptId: attempt.attemptId };
  }

  @Get(':attemptId/resume')
  @ApiOperation({ 
    summary: 'Get / Resume an in-progress attempt',
    description: 'Load an existing in-progress attempt and recover previous answers, state, time, and review statuses. Cannot be used for submitted attempts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Attempt resumed successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot resume a submitted attempt',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found',
  })
  async resumeAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.getAttempt(attemptId, authContext);
    return attempt;
  }

  @Get(':attemptId/questions')
  @ApiOperation({ summary: 'Get questions for an attempt' })
  @ApiResponse({ status: 200, description: 'Questions retrieved', type: ApiSuccessResponseDto })
  async getAttemptQuestions(@Param('attemptId') attemptId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.attemptsService.getAttemptQuestions(attemptId, authContext);
  }

  @Post(':attemptId/answers')
  @ApiOperation({ summary: 'Submit an answer for a question' })
  @ApiResponse({ status: 200, description: 'Answer submitted', type: ApiSuccessResponseDto })
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    await this.attemptsService.submitAnswer(attemptId, submitAnswerDto, authContext);
    return { message: 'Answer submitted successfully' };
  }

  @Post(':attemptId/submit')
  @ApiOperation({ summary: 'Submit a test attempt' })
  @ApiResponse({ status: 200, description: 'Attempt submitted', type: ApiSuccessResponseDto })
  async submitAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.submitAttempt(attemptId, authContext);
    return { 
      attemptId: attempt.attemptId, 
      score: attempt.score,
      reviewStatus: attempt.reviewStatus,
      result: attempt.result 
    };
  }

  @Post(':attemptId/review')
  @ApiOperation({ summary: 'Review a test attempt (for subjective questions)' })
  @ApiResponse({ status: 200, description: 'Attempt reviewed', type: ApiSuccessResponseDto })
  async reviewAttempt(
    @Param('attemptId') attemptId: string,
    @Body() reviewDto: ReviewAttemptDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.reviewAttempt(attemptId, reviewDto, authContext);
    return { 
      attemptId: attempt.attemptId, 
      score: attempt.score,
      result: attempt.result 
    };
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'Get pending reviews for subjective questions' })
  @ApiResponse({ status: 200, description: 'Pending reviews retrieved', type: ApiSuccessResponseDto })
  async getPendingReviews(@Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.attemptsService.getPendingReviews(authContext);
  }

} 