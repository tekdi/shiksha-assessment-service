import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileUploadService } from '@/common/services/file-upload.service';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { AssessmentFileUploadInterceptor } from './assessment-file-upload.interceptor';

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('file')
@UseInterceptors(AuthContextInterceptor)
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload file for assessment (feedback/reflection)',
    description:
      'Upload a file to S3. Returns the URL to use in submit-answer as answer.file for file-type questions. Same pattern as LMS file upload. Max size from env ASSESSMENT_FILE_MAX_SIZE_MB (default 10 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded; use returned "file" URL in answer payload.' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid file type/size' })
  @UseInterceptors(AssessmentFileUploadInterceptor)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file provided or file too large');
    }
    const result = await this.fileUploadService.uploadFile(
      file,
      req.user?.userId,
    );
    return result;
  }
}
