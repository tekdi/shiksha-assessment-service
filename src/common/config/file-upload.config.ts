import { ConfigService } from '@nestjs/config';

/** Default max upload size when env is missing or invalid (MB). */
export const DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB = 10;

/** Legacy constant: same as default bytes; prefer getAssessmentFileMaxSizeBytes() for env-driven value. */
export function getDefaultMaxSizeInBytes(): number {
  return DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB * 1024 * 1024;
}

/**
 * Max file size in bytes from ASSESSMENT_FILE_MAX_SIZE_MB (MB), default 10 MB.
 * Read via ConfigService so values stay in sync with Nest env loading at runtime.
 */
export function getAssessmentFileMaxSizeBytes(configService: ConfigService): number {
  const raw = configService.get<string>('ASSESSMENT_FILE_MAX_SIZE_MB');
  const trimmed = raw === undefined || raw === null ? '' : String(raw).trim();
  const mb = trimmed === '' ? DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB : Number(trimmed);
  if (!Number.isFinite(mb) || mb <= 0) {
    return DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB * 1024 * 1024;
  }
  return Math.floor(mb * 1024 * 1024);
}

export const FILE_UPLOAD_CONFIG = {
  /** S3 key prefix under bucket (e.g. assessment/feedback-files) */
  uploadPath: process.env.ASSESSMENT_UPLOAD_PATH || 'assessment/feedback-files',

  /** Allowed MIME types (documents + images for feedback/reflection) */
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],

  /** Allowed file extensions for validation */
  allowedExtensions: [
    '.pdf',
    '.doc',
    '.docx',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
  ],
} as const;

export function assessmentUploadFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, acceptFile: boolean) => void,
): void {
  const ext = file.originalname.toLowerCase().split('.').pop();
  const allowedExt = FILE_UPLOAD_CONFIG.allowedExtensions.map((e) => e.replace('.', ''));
  if (!ext || !allowedExt.includes(ext)) {
    cb(new Error(`Invalid file type. Allowed: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`), false);
    return;
  }
  if (!(FILE_UPLOAD_CONFIG.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
    cb(
      new Error(`Invalid MIME type. Allowed: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`),
      false,
    );
    return;
  }
  cb(null, true);
}
