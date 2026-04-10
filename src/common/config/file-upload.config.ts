import { ConfigService } from '@nestjs/config';

/** Default max upload size when env is missing or invalid (MB). */
export const DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB = 10;

/**
 * Hard ceiling (MB) for uploads using multer `memoryStorage()` — entire file is buffered in RAM per request.
 * Values above this are clamped even if ASSESSMENT_FILE_MAX_SIZE_MB is higher (prevents accidental OOM).
 */
export const HARD_CAP_ASSESSMENT_FILE_SIZE_MB = 100;

/** Legacy constant: same as default bytes; prefer getAssessmentFileMaxSizeBytes() for env-driven value. */
export function getDefaultMaxSizeInBytes(): number {
  return DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB * 1024 * 1024;
}

function clampFileSizeMb(mb: number): number {
  const capped = Math.min(mb, HARD_CAP_ASSESSMENT_FILE_SIZE_MB);
  return Math.max(capped, 1);
}

/**
 * Max file size in bytes from ASSESSMENT_FILE_MAX_SIZE_MB (MB), default 10 MB, capped at HARD_CAP (100 MB).
 * Read via ConfigService so values stay in sync with Nest env loading at runtime.
 */
export function getAssessmentFileMaxSizeBytes(configService: ConfigService): number {
  const raw = configService.get<string>('ASSESSMENT_FILE_MAX_SIZE_MB');
  const trimmed = raw === undefined || raw === null ? '' : String(raw).trim();
  const mb = trimmed === '' ? DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB : Number(trimmed);
  if (!Number.isFinite(mb) || mb <= 0) {
    return clampFileSizeMb(DEFAULT_ASSESSMENT_FILE_MAX_SIZE_MB) * 1024 * 1024;
  }
  return Math.floor(clampFileSizeMb(mb) * 1024 * 1024);
}

export const FILE_UPLOAD_CONFIG = {
  /** S3 key prefix under bucket (e.g. assessment/feedback-files) */
  uploadPath: process.env.ASSESSMENT_UPLOAD_PATH || 'assessment/feedback-files',

  /** Allowed MIME types (documents + images + MP4 video for feedback/reflection) */
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
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
    '.mp4',
  ],
} as const;

/** Extension (no dot, lowercase) → primary MIME for uploads */
export const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
};

/** Some clients send generic binary MIME for MP4; still safe if extension is .mp4 */
export const MP4_ALTERNATIVE_MIME = 'application/octet-stream' as const;

export function isAllowedMimeForExtension(extNoDot: string, mimetype: string): boolean {
  const ext = normalizeFileExtension(extNoDot);
  if (ext === 'mp4') {
    return mimetype === EXTENSION_TO_MIME.mp4 || mimetype === MP4_ALTERNATIVE_MIME;
  }
  return (FILE_UPLOAD_CONFIG.allowedMimeTypes as readonly string[]).includes(mimetype);
}

export function normalizeFileExtension(raw: string): string {
  return String(raw).trim().replace(/^\.+/, '').toLowerCase();
}

/** Normalized extensions the server will ever accept (question `allowedFileExtensions` must be a subset). */
export const SERVER_ALLOWED_FILE_EXTENSIONS: readonly string[] = FILE_UPLOAD_CONFIG.allowedExtensions.map((e) =>
  e.replace('.', '').toLowerCase(),
);

export function assertExtensionsSubsetOfServerAllowlist(extensions: string[]): void {
  const server = new Set(SERVER_ALLOWED_FILE_EXTENSIONS);
  for (const raw of extensions) {
    const e = normalizeFileExtension(raw);
    if (!e || !server.has(e)) {
      throw new Error(
        `Unsupported file extension "${raw}". Allowed on server: ${SERVER_ALLOWED_FILE_EXTENSIONS.join(', ')}`,
      );
    }
  }
}

/**
 * Multer file filter. Pass `null`/undefined/empty array to use full server allowlist.
 * Non-empty `allowedExtensions` restricts to that subset (for `file` questions with `params.allowedFileExtensions`).
 */
export function createAssessmentUploadFileFilter(
  allowedExtensions?: string[] | null,
): (_req: any, file: Express.Multer.File, cb: (err: Error | null, acceptFile: boolean) => void) => void {
  const normalized = (allowedExtensions ?? [])
    .map((x) => normalizeFileExtension(x))
    .filter((x) => x.length > 0);
  const useSubset = normalized.length > 0;
  const extSet = useSubset ? new Set(normalized) : new Set(SERVER_ALLOWED_FILE_EXTENSIONS);
  const fullMimeSet = new Set(FILE_UPLOAD_CONFIG.allowedMimeTypes as readonly string[]);

  return (_req: any, file: Express.Multer.File, cb: (err: Error | null, acceptFile: boolean) => void): void => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (!ext || !extSet.has(ext)) {
      const list = [...extSet].map((e) => `.${e}`).join(', ');
      cb(new Error(`Invalid file type. Allowed: ${list}`), false);
      return;
    }
    const expectedMime = EXTENSION_TO_MIME[ext];
    if (useSubset && expectedMime) {
      const ok =
        file.mimetype === expectedMime ||
        (ext === 'mp4' && file.mimetype === MP4_ALTERNATIVE_MIME);
      if (!ok) {
        cb(new Error(`Invalid MIME type for .${ext}. Expected ${expectedMime}.`), false);
        return;
      }
    } else if (!fullMimeSet.has(file.mimetype) && !isAllowedMimeForExtension(ext, file.mimetype)) {
      cb(
        new Error(`Invalid MIME type. Allowed: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`),
        false,
      );
      return;
    }
    cb(null, true);
  };
}

export function assessmentUploadFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, acceptFile: boolean) => void,
): void {
  createAssessmentUploadFileFilter(null)(_req, file, cb);
}
