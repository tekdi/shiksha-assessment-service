import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import {
  FILE_UPLOAD_CONFIG,
  getAssessmentFileMaxSizeBytes,
} from '@/common/config/file-upload.config';

export interface FileUploadResult {
  /** AWS S3 URL to use in answer payload as { "file": "<this url>" } */
  file: string;
  fileSize: number;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('CLOUD_STORAGE_REGION')?.trim() ||
      this.configService.get<string>('AWS_REGION');
    const bucket =
      this.configService.get<string>('CLOUD_STORAGE_BUCKET_NAME')?.trim() ||
      this.configService.get<string>('AWS_BUCKET_NAME');
    const accessKeyId =
      this.configService.get<string>('CLOUD_STORAGE_ACCESS_KEY_ID')?.trim() ||
      this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('CLOUD_STORAGE_SECRET_ACCESS_KEY')?.trim() ||
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    this.region = region || 'us-east-1';
    this.bucket = bucket || '';
    this.uploadPath =
      this.configService.get<string>('ASSESSMENT_UPLOAD_PATH')?.trim() ||
      FILE_UPLOAD_CONFIG.uploadPath;

    if (bucket && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload a file to S3. Returns the public URL to store in testUserAnswers.answer as { "file": "<url>" }.
   * Use for file-type questions (feedback/reflection forms).
   */
  async uploadFile(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<FileUploadResult> {
    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException(
        'File upload is not configured. Set CLOUD_STORAGE_* or AWS_* environment variables.',
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!(FILE_UPLOAD_CONFIG.allowedExtensions as readonly string[]).includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
      );
    }
    if (!(FILE_UPLOAD_CONFIG.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Allowed: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`,
      );
    }

    const maxBytes = getAssessmentFileMaxSizeBytes(this.configService);
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(maxBytes / 1024 / 1024)}MB)`,
      );
    }

    const timestamp = Date.now();
    const safeName = `${uuidv4()}_${timestamp}${ext}`;
    const key = userId
      ? `${this.uploadPath}/${userId}/${safeName}`
      : `${this.uploadPath}/${safeName}`;

    const body = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentLength: body.length,
          ContentType: file.mimetype,
          ContentDisposition: `attachment; filename="${file.originalname}"`,
          Metadata: {
            originalFileName: file.originalname,
            fileSize: String(file.size),
            uploadedAt: new Date().toISOString(),
          },
        }),
      );
    } catch (error: any) {
      this.logger.error(`S3 upload failed: ${error?.message || error}`, error?.stack);
      throw new InternalServerErrorException(
        `Failed to upload file. ${error?.message || error}`,
      );
    }

    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return {
      file: fileUrl,
      fileSize: file.size,
    };
  }

  /**
   * Delete an object from S3 using the URL returned by uploadFile.
   * Only URLs for this bucket and ASSESSMENT_UPLOAD_PATH prefix are accepted.
   */
  async deleteFileByUrl(fileUrl: string): Promise<{ key: string }> {
    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set CLOUD_STORAGE_* or AWS_* environment variables.',
      );
    }

    const key = this.parseAndValidateAssessmentObjectKey(fileUrl.trim());

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`S3 delete failed for key prefix: ${key.slice(0, 64)}…`, (error as Error)?.stack);
      throw new InternalServerErrorException(`Failed to delete file. ${msg}`);
    }

    return { key };
  }

  /**
   * Extract S3 object key from URL and ensure it belongs to this app’s bucket and upload prefix.
   */
  private parseAndValidateAssessmentObjectKey(fileUrl: string): string {
    let url: URL;
    try {
      url = new URL(fileUrl);
    } catch {
      throw new BadRequestException('Invalid file URL');
    }

    if (url.protocol !== 'https:') {
      throw new BadRequestException('Only https:// file URLs are allowed');
    }

    const host = url.hostname.toLowerCase();
    const bucket = this.bucket.toLowerCase();
    const region = this.region.toLowerCase();

    const virtualHosted = `${bucket}.s3.${region}.amazonaws.com`;
    const virtualHostedDualstack = `${bucket}.s3.dualstack.${region}.amazonaws.com`;
    const pathStyle = `s3.${region}.amazonaws.com`;
    const pathStyleDualstack = `s3.dualstack.${region}.amazonaws.com`;

    let key: string;

    if (host === virtualHosted || host === virtualHostedDualstack) {
      const path = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      key = decodeURIComponent(path);
    } else if (host === pathStyle || host === pathStyleDualstack) {
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length < 2 || segments[0].toLowerCase() !== bucket) {
        throw new ForbiddenException('URL does not match configured bucket');
      }
      key = decodeURIComponent(segments.slice(1).join('/'));
    } else {
      throw new ForbiddenException('URL host does not match this service S3 bucket');
    }

    if (!key || key.includes('..')) {
      throw new BadRequestException('Invalid object key');
    }

    const prefix = this.uploadPath.replace(/^\/+|\/+$/g, '');
    if (!prefix || !key.startsWith(`${prefix}/`)) {
      throw new ForbiddenException('Only files under the assessment upload path can be deleted');
    }

    return key;
  }
}
