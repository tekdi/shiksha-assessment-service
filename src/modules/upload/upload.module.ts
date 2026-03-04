import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { FileUploadService } from '@/common/services/file-upload.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class UploadModule {}
