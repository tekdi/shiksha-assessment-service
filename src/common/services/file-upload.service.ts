import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import {
  FILE_UPLOAD_CONFIG,
  getAssessmentFileMaxSizeBytes,
  isAllowedMimeForExtension,
  MP4_ALTERNATIVE_MIME,
} from '@/common/config/file-upload.config';

export interface FileUploadResult {
  /** AWS S3 URL to use in answer payload as { "file": "<this url>" } */
  file: string;
  fileSize: number;
}

export interface FileDownloadUrlResult {
  /** Time-limited signed URL for downloading private object */
  downloadUrl: string;
  /** Expiry in seconds used for signed URL generation */
  expiresIn: number;
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
      this.configService.get<string>('CLOUD_STORAGE_PRIVATE_BUCKET_NAME')?.trim() ||
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
        'File upload is not configured. Set CLOUD_STORAGE_PRIVATE_BUCKET_NAME (or CLOUD_STORAGE_BUCKET_NAME/AWS_BUCKET_NAME) with valid cloud storage credentials.',
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!(FILE_UPLOAD_CONFIG.allowedExtensions as readonly string[]).includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
      );
    }
    const extNoDot = ext.startsWith('.') ? ext.slice(1) : ext;
    if (!isAllowedMimeForExtension(extNoDot, file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Allowed: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')} (MP4 may be sent as application/octet-stream)`,
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
    const contentType =
      ext === '.mp4' && file.mimetype === MP4_ALTERNATIVE_MIME ? 'video/mp4' : file.mimetype;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentLength: body.length,
          ContentType: contentType,
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
        'File storage is not configured. Set CLOUD_STORAGE_PRIVATE_BUCKET_NAME (or CLOUD_STORAGE_BUCKET_NAME/AWS_BUCKET_NAME) with valid cloud storage credentials.',
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
   * Create a short-lived signed URL for downloading a private object.
   * Accepts the same file URL that was returned by uploadFile.
   */
  async getDownloadUrl(fileUrl: string): Promise<FileDownloadUrlResult> {
    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set CLOUD_STORAGE_PRIVATE_BUCKET_NAME (or CLOUD_STORAGE_BUCKET_NAME/AWS_BUCKET_NAME) with valid cloud storage credentials.',
      );
    }

    const key = this.parseAndValidateAssessmentObjectKey(fileUrl.trim());
    const expiresIn = this.getDownloadUrlExpirySeconds();
    const fileName = this.getSafeDownloadFileName(key);

    try {
      const downloadUrl = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ResponseContentDisposition: `attachment; filename="${fileName}"`,
        }),
        { expiresIn },
      );

      return { downloadUrl, expiresIn };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `S3 signed-download URL generation failed for key prefix: ${key.slice(0, 64)}…`,
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException(`Failed to create download URL. ${msg}`);
    }
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

    const prefix = this.uploadPath.replaceAll(/^\/+|\/+$/g, '');
    if (!prefix || !key.startsWith(`${prefix}/`)) {
      throw new ForbiddenException('Only files under the assessment upload path can be deleted');
    }

    return key;
  }

  private getDownloadUrlExpirySeconds(): number {
    const raw = this.configService.get<string>('ASSESSMENT_FILE_DOWNLOAD_URL_EXPIRES_IN_SECONDS');
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) {
      return 300;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return 300;
    }
    return Math.max(60, Math.min(3600, Math.floor(parsed)));
  }

  private getSafeDownloadFileName(key: string): string {
    const segments = key.split('/');
    let raw = 'download';
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      if (segments[i]) {
        raw = segments[i];
        break;
      }
    }
    return raw.replaceAll(/["\\]/g, '');
  }
}
