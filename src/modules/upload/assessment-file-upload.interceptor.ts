import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable, throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import multer, { memoryStorage } from 'multer';
import {
  createAssessmentUploadFileFilter,
  assessmentUploadFileFilter,
  getAssessmentFileMaxSizeBytes,
} from '@/common/config/file-upload.config';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';

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
const QUESTION_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AssessmentFileUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const defaultMaxBytes = getAssessmentFileMaxSizeBytes(this.configService);
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    return from(this.resolveUploadConfig(req, defaultMaxBytes)).pipe(
      mergeMap(({ fileFilter, effectiveMaxBytes }) => {
        const contentLength = req.headers['content-length'];
        if (contentLength !== undefined) {
          const total = Number(contentLength);
          if (Number.isFinite(total) && total > effectiveMaxBytes + MULTIPART_OVERHEAD_BYTES) {
            return throwError(
              () =>
                new PayloadTooLargeException(
                  `Upload exceeds maximum allowed (${Math.round(effectiveMaxBytes / 1024 / 1024)}MB file limit)`,
                ),
            );
          }
        }

        const upload = multer({
          storage: memoryStorage(),
          limits: {
            fileSize: effectiveMaxBytes,
            files: 1,
            fields: 24,
            fieldSize: 1024 * 1024,
            parts: 48,
          },
          fileFilter,
        }).single('file');

        return new Observable<unknown>((observer) => {
          upload(req, res, (err: unknown) => {
            if (err) {
              const message = multerErrorMessage(err);
              const code = (err as { code?: string })?.code;
              if (message === 'File too large' || code === 'LIMIT_FILE_SIZE') {
                observer.error(
                  new BadRequestException(
                    `File size exceeds maximum allowed (${Math.round(effectiveMaxBytes / 1024 / 1024)}MB)`,
                  ),
                );
                return;
              }
              if (
                code === 'LIMIT_FIELD_KEY' ||
                code === 'LIMIT_FIELD_VALUE' ||
                code === 'LIMIT_FIELD_COUNT' ||
                code === 'LIMIT_PART_COUNT' ||
                code === 'LIMIT_FILE_COUNT' ||
                code === 'LIMIT_UNEXPECTED_FILE'
              ) {
                observer.error(
                  new BadRequestException(
                    'Multipart request exceeds allowed size or part limits for this upload',
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
      }),
    );
  }

  private async resolveUploadConfig(
    req: { query?: Record<string, unknown>; user?: AuthContext },
    defaultMaxBytes: number,
  ): Promise<{
    fileFilter: (r: any, file: Express.Multer.File, cb: (err: Error | null, acceptFile: boolean) => void) => void;
    effectiveMaxBytes: number;
  }> {
    const raw = req.query?.questionId;
    const questionId = typeof raw === 'string' ? raw.trim() : '';
    if (!questionId) {
      return { fileFilter: assessmentUploadFileFilter, effectiveMaxBytes: defaultMaxBytes };
    }
    if (!QUESTION_ID_UUID.test(questionId)) {
      throw new BadRequestException('Invalid questionId query parameter');
    }
    const auth = req.user;
    if (!auth?.tenantId || !auth?.organisationId) {
      return { fileFilter: assessmentUploadFileFilter, effectiveMaxBytes: defaultMaxBytes };
    }
    const q = await this.questionRepository.findOne({
      where: {
        questionId,
        tenantId: auth.tenantId,
        organisationId: auth.organisationId,
      },
      select: ['questionId', 'type', 'params'],
    });
    if (!q) {
      throw new BadRequestException('Question not found for this upload');
    }
    if (q.type !== QuestionType.FILE) {
      throw new BadRequestException('This question does not accept file uploads');
    }
    const allowed = q.params?.allowedFileExtensions;
    const fileFilter = createAssessmentUploadFileFilter(
      allowed && allowed.length > 0 ? allowed : null,
    );
    const questionMaxSizeMb = q.params?.maxFileSizeMb;
    const effectiveMaxBytes = questionMaxSizeMb && questionMaxSizeMb >= 1
      ? Math.floor(questionMaxSizeMb * 1024 * 1024)
      : defaultMaxBytes;
    return { fileFilter, effectiveMaxBytes };
  }
}
