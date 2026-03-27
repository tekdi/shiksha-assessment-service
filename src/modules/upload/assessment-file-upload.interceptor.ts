import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import multer, { memoryStorage } from 'multer';
import {
  assessmentUploadFileFilter,
  getAssessmentFileMaxSizeBytes,
} from '@/common/config/file-upload.config';

/**
 * Multer upload with limits.fileSize driven by ASSESSMENT_FILE_MAX_SIZE_MB at request time (default 10 MB).
 */
@Injectable()
export class AssessmentFileUploadInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const maxBytes = getAssessmentFileMaxSizeBytes(this.configService);
    const upload = multer({
      storage: memoryStorage(),
      limits: { fileSize: maxBytes },
      fileFilter: assessmentUploadFileFilter,
    }).single('file');

    return new Observable((observer) => {
      const http = context.switchToHttp();
      const req = http.getRequest();
      const res = http.getResponse();

      upload(req, res, (err: unknown) => {
        if (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message === 'File too large' || (err as { code?: string })?.code === 'LIMIT_FILE_SIZE') {
            observer.error(
              new BadRequestException(
                `File size exceeds maximum allowed (${Math.round(maxBytes / 1024 / 1024)}MB)`,
              ),
            );
            return;
          }
          observer.error(new BadRequestException(message || 'Upload failed'));
          return;
        }
        next.handle().subscribe(observer);
      });
    });
  }
}
