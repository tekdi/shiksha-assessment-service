import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { FileUploadService } from '@/common/services/file-upload.service';
import { AssessmentFileUploadInterceptor } from './assessment-file-upload.interceptor';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [FileUploadService, AssessmentFileUploadInterceptor],
  exports: [FileUploadService],
})
export class UploadModule {}
