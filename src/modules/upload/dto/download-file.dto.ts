import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class DownloadFileDto {
  @ApiProperty({
    description:
      'Full S3 object URL returned from POST /file/upload (same bucket and assessment upload prefix only).',
    example: 'https://my-bucket.s3.us-east-1.amazonaws.com/assessment/feedback-files/user-id/uuid_123.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  file: string;
}
