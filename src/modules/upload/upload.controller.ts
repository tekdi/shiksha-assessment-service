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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileUploadService } from '@/common/services/file-upload.service';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { FILE_UPLOAD_CONFIG } from '@/common/config/file-upload.config';

const uploadMulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.maxSizeInBytes,
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: (err: Error | null, acceptFile: boolean) => void) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const allowedExt = FILE_UPLOAD_CONFIG.allowedExtensions.map((e) => e.replace('.', ''));
    if (!ext || !allowedExt.includes(ext)) {
      cb(new Error(`Invalid file type. Allowed: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`), false);
      return;
    }
    if (!(FILE_UPLOAD_CONFIG.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
      cb(new Error(`Invalid MIME type. Allowed: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`), false);
      return;
    }
    cb(null, true);
  },
};

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
      'Upload a file to S3. Returns the URL to use in submit-answer as answer.file for file-type questions. Same pattern as LMS file upload.',
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
  @UseInterceptors(FileInterceptor('file', uploadMulterOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided or file too large');
    }
    const authContext: AuthContext = req.user;
    const result = await this.fileUploadService.uploadFile(file, authContext?.userId);
    return result;
  }
}
