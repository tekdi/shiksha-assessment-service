/**
 * File upload configuration for assessment file-type questions (feedback/reflection).
 * Same pattern as LMS: allowed types and max size for uploaded files.
 */
export const FILE_UPLOAD_CONFIG = {
  /** S3 key prefix under bucket (e.g. assessment/feedback-files) */
  uploadPath: process.env.ASSESSMENT_UPLOAD_PATH || 'assessment/feedback-files',

  /** Max file size in bytes (default 10MB). Override with env ASSESSMENT_FILE_MAX_SIZE_MB. */
  maxSizeInBytes: 10 * 1024 * 1024,

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
