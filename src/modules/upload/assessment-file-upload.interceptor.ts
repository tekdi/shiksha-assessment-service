import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import multer, { memoryStorage } from 'multer';
import {
  assessmentUploadFileFilter,
  getAssessmentFileMaxSizeBytes,
} from '@/common/config/file-upload.config';

function multerErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (err !== null && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }
  }
  return 'Upload failed';
}

/** Extra bytes beyond `fileSize` for multipart boundaries, disposition headers, and small text fields. */
const MULTIPART_OVERHEAD_BYTES = 2 * 1024 * 1024;

/**
 * Multer + memoryStorage: RAM is bounded by `limits.fileSize` (see getAssessmentFileMaxSizeBytes:
 * ASSESSMENT_FILE_MAX_SIZE_MB, hard-capped for OOM safety). HTTP Content-Length is the whole body;
 * we optionally reject when it clearly exceeds file limit + overhead (chunked uploads skip this).
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

      const contentLength = req.headers['content-length'];
      if (contentLength !== undefined) {
        const total = Number(contentLength);
        if (Number.isFinite(total) && total > maxBytes + MULTIPART_OVERHEAD_BYTES) {
          observer.error(
            new PayloadTooLargeException(
              `Upload exceeds maximum allowed (${Math.round(maxBytes / 1024 / 1024)}MB file limit)`,
            ),
          );
          return;
        }
      }

      upload(req, res, (err: unknown) => {
        if (err) {
          const message = multerErrorMessage(err);
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
