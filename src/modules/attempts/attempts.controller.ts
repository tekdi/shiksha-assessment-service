import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SubmitMultipleAnswersDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { TestAttempt } from '../tests/entities/test-attempt.entity';

@ApiTags('Test Attempts')
@ApiBearerAuth()
@Controller('attempts')
@UseInterceptors(AuthContextInterceptor)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start/:testId')
  @ApiOperation({ summary: 'Start a new test attempt' })
  @ApiResponse({
    status: 201,
    description: 'Attempt started',
    type: ApiSuccessResponseDto,
  })
  async startAttempt(@Param('testId') testId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.startAttempt(
      testId,
      authContext.userId,
      authContext
    );
    return { attemptId: attempt.attemptId };
  }

  @Get(':attemptId/resume/:userId')
  @ApiOperation({
    summary: 'Get / Resume an in-progress attempt',
    description:
      'Load an existing in-progress attempt and recover previous answers, state, time, and review statuses. Cannot be used for submitted attempts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempt resumed successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot resume a submitted attempt',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found',
  })
  async resumeAttempt(
    @Param('attemptId') attemptId: string,
    @Param('userId') userId: string,
    @Req() req: any
  ): Promise<{ result: any }> {
    const authContext: AuthContext = req.user;
    const result = await this.attemptsService.getAttemptAnswers(
      attemptId,
      userId,
      authContext
    );
    return result;
  }

  @Get(':attemptId/questions/:userId')
  @ApiOperation({ summary: 'Get questions for an attempt' })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved',
    type: ApiSuccessResponseDto,
  })
  async getAttemptQuestions(
    @Param('attemptId') attemptId: string,
    @Param('userId') userId: string,
    @Req() req: any
  ) {
    const authContext: AuthContext = req.user;
    return this.attemptsService.getAttemptQuestions(
      attemptId,
      userId,
      authContext
    );
  }

  @Post(':attemptId/answers')
  @ApiOperation({
    summary: 'Submit multiple answers for questions',
    description:
      'Submit answers for multiple questions in a test attempt. Accepts an object with answers array and optional global timeSpent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Answers submitted',
    type: ApiSuccessResponseDto,
  })
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() submitAnswerDto: SubmitMultipleAnswersDto,
    @Req() req: any
  ) {
    const authContext: AuthContext = req.user;

    // Submit all answers efficiently in one call
    const result = await this.attemptsService.submitAnswer(
      attemptId,
      submitAnswerDto,
      authContext
    );
    return result;
  }

  @Post(':attemptId/submit')
  @ApiOperation({ summary: 'Submit a test attempt' })
  @ApiResponse({
    status: 200,
    description: 'Attempt submitted',
    type: ApiSuccessResponseDto,
  })
  async submitAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.submitAttempt(
      attemptId,
      authContext
    );
    return attempt;
  }

  @Post(':attemptId/review')
  @ApiOperation({ summary: 'Review a test attempt (for subjective questions)' })
  @ApiResponse({
    status: 200,
    description: 'Attempt reviewed',
    type: ApiSuccessResponseDto,
  })
  async reviewAttempt(
    @Param('attemptId') attemptId: string,
    @Body() reviewDto: ReviewAttemptDto,
    @Req() req: any
  ) {
    const authContext: AuthContext = req.user;
    const attempt = await this.attemptsService.reviewAttempt(
      attemptId,
      reviewDto,
      authContext
    );
    return {
      attemptId: attempt.attemptId,
      score: attempt.score,
      result: attempt.result,
      reviewStatus: attempt.reviewStatus,
    };
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'Get pending reviews for subjective questions' })
  @ApiResponse({
    status: 200,
    description: 'Pending reviews retrieved',
    type: ApiSuccessResponseDto,
  })
  async getPendingReviews(@Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.attemptsService.getPendingReviews(authContext);
  }

  @Get(':attemptId/answersheet')
  @ApiOperation({
    summary: 'Get attempt answersheet',
    description:
      'Retrieve the complete answersheet of a submitted attempt including scores, answers, and review status',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempt answersheet retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found',
  })
  async getAttemptAnswersheet(
    @Param('attemptId') attemptId: string,
    @Req() req: any
  ): Promise<any> {
    const authContext: AuthContext = req.user;
    const result = await this.attemptsService.getAttemptAnswersheet(
      attemptId,
      authContext
    );
    return result;
  }

  @Get(':attemptId/answers')
  @ApiOperation({
    summary: 'Get attempt answers and sync to LMS',
    description:
      'Retrieve answers for an attempt, map to correct lesson, and sync to LMS tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Answers retrieved and synced successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found',
  })
  async getAttemptAnswers(
    @Param('attemptId') attemptId: string,
    @Req() req: any
  ): Promise<any> {
    const authContext: AuthContext = req.user;
    
    // Extract authorization header from request
    const authorization = req.headers.authorization;
    
    const result = await this.attemptsService.getAttemptAnswersAndSync(
      attemptId,
      authContext,
      authorization
    );
    return result;
  }
  /**
   * Get all attempts for a user
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all attempts for a user',
    description: 'Retrieve all test attempts for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [TestAttempt],
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserAttempts(
    @Param('userId') userId: string,
    @Req() req: any
  ): Promise<{ success: boolean; data: TestAttempt[] }> {
    try {
      const authContext: AuthContext = req.user;
      const attempts = await this.attemptsService.getUserAttempts(
        userId,
        authContext
      );

      return {
        success: true,
        data: attempts,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get attempts for user ${userId}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get test status for a user
   */
  @Get('tests/:testId/users/:userId/status')
  @ApiOperation({
    summary: 'Get test status for a user',
    description:
      'Retrieve test status and answers for a specific user and test',
  })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Test status retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Test or user not found',
  })
  async getTestStatusForUser(
    @Param('testId') testId: string,
    @Param('userId') userId: string,
    @Req() req: any
  ): Promise<{ success: boolean; data: any }> {
    try {
      const authContext: AuthContext = req.user;
      const testStatus = await this.attemptsService.getTestStatusForUser(
        testId,
        userId,
        authContext
      );

      return {
        success: true,
        data: testStatus,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get test status for test ${testId} and user ${userId}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
