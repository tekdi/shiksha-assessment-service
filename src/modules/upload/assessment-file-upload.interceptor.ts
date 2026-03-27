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
 * Multer upload: only limits.fileSize (from getAssessmentFileMaxSizeBytes: env + hard RAM cap).
 * Other multipart limits use library defaults to avoid surprising existing clients.
 */
@Injectable()
export class AssessmentFileUploadInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const maxBytes = getAssessmentFileMaxSizeBytes(this.configService);
    const upload = multer({
      storage: memoryStorage(),
      // Only enforce per-file size (aligned with env + hard cap in file-upload.config).
      // Avoid custom fields/files/parts limits so behavior stays default multer/busboy — least risk to existing clients.
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
          const code = (err as { code?: string })?.code;
          if (message === 'File too large' || code === 'LIMIT_FILE_SIZE') {
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
