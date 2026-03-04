import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FILE_UPLOAD_CONFIG } from '@/common/config/file-upload.config';

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

    const maxBytes =
      Number(this.configService.get<string>('ASSESSMENT_FILE_MAX_SIZE_MB')) *
        1024 * 1024 ||
      FILE_UPLOAD_CONFIG.maxSizeInBytes;
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
}
