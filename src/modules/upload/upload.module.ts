import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { FileUploadService } from '@/common/services/file-upload.service';
import { AssessmentFileUploadInterceptor } from './assessment-file-upload.interceptor';
import { Question } from '../questions/entities/question.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Question])],
  controllers: [UploadController],
  providers: [FileUploadService, AssessmentFileUploadInterceptor],
  exports: [FileUploadService],
})
export class UploadModule {}
