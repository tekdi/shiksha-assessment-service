import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class DeleteFileDto {
  @ApiProperty({
    description:
      'Full S3 object URL exactly as returned from POST /file/upload (same bucket and key prefix only).',
    example: 'https://my-bucket.s3.us-east-1.amazonaws.com/assessment/feedback-files/user-id/uuid_123.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  file: string;
}
