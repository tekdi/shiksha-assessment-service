import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileUploadService } from '@/common/services/file-upload.service';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { AssessmentFileUploadInterceptor } from './assessment-file-upload.interceptor';
import { DeleteFileDto } from './dto/delete-file.dto';
import { DownloadFileDto } from './dto/download-file.dto';

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('file')
@UseInterceptors(AuthContextInterceptor)
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiQuery({
    name: 'questionId',
    required: false,
    description:
      'Optional. When set to a `file` question ID in your tenant, upload is restricted to that question\'s params.allowedFileExtensions (or all server-supported types if unset).',
  })
  @ApiOperation({
    summary: 'Upload file for assessment (feedback/reflection)',
    description:
      'Upload a file to S3. Returns the URL to use in submit-answer as answer.file for file-type questions. Same pattern as LMS file upload. Max size from env ASSESSMENT_FILE_MAX_SIZE_MB (default 10 MB). Optional query questionId enforces per-question allowed extensions from params.allowedFileExtensions.',
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

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an assessment file from S3',
    description:
      'Deletes the object identified by the URL returned from POST /file/upload. Only URLs for this service bucket and assessment upload prefix (ASSESSMENT_UPLOAD_PATH) are accepted.',
  })
  @ApiResponse({ status: 200, description: 'Object removed (or was already absent).' })
  @ApiResponse({ status: 400, description: 'Invalid URL' })
  @ApiResponse({ status: 403, description: 'URL not allowed (wrong bucket or prefix)' })
  async deleteFile(@Body() dto: DeleteFileDto) {
    await this.fileUploadService.deleteFileByUrl(dto.file);
    return { message: 'File deleted successfully' };
  }

  @Post('download-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get signed download URL for a private assessment file',
    description:
      'Generates a short-lived signed URL for downloading a file previously uploaded via POST /file/upload. Only URLs for this service bucket and assessment upload prefix are accepted.',
  })
  @ApiResponse({ status: 200, description: 'Signed URL generated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid URL' })
  @ApiResponse({ status: 403, description: 'URL not allowed (wrong bucket or prefix)' })
  async getDownloadUrl(@Body() dto: DownloadFileDto) {
    return this.fileUploadService.getDownloadUrl(dto.file);
  }
}
