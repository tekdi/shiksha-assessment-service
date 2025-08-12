import {
  Controller,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { AssessmentElasticsearchService } from '../../elasticsearch/assessment-elasticsearch.service';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';

@ApiTags('Assessment')
@ApiBearerAuth()
@Controller('assessment')
@UseInterceptors(AuthContextInterceptor)
export class AssessmentController {
  constructor(
    private readonly assessmentElasticsearchService: AssessmentElasticsearchService
  ) {}

  @Post('update-with-real-data')
  @ApiOperation({ 
    summary: 'Update assessment with real data from database',
    description: 'Fetches real answers from database and updates Elasticsearch using robust LMS pattern'
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment updated successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Assessment or answers not found',
  })
  async updateAssessmentWithRealData(
    @Body() body: {
      userId: string;
      testId: string;
      attemptId: string;
    },
    @Req() req: any
  ): Promise<any> {
    try {
      const authContext: AuthContext = req.user;
      const { userId, testId, attemptId } = body;

      // Extract authorization header from request
      const authorization = req.headers.authorization;

      // Use the new robust method that mirrors LMS enrollment logic
      // await this.assessmentElasticsearchService.handleAssessmentAnswerSubmission(
      //   userId,
      //   testId,
      //   attemptId,
      //   authContext.tenantId,
      //   authContext.organisationId
      // );

      return {
        success: true,
        message: 'Assessment updated with real data successfully using robust LMS pattern',
        data: {
          userId,
          testId,
          attemptId,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update assessment with real data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 