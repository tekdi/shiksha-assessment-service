import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentElasticsearchService } from './assessment-elasticsearch.service';
import { AttemptsModule } from '../modules/attempts/attempts.module';
import { AuthModule } from '../common/services/auth.module';
import { TestAttempt } from '../modules/tests/entities/test-attempt.entity';

@Module({
  imports: [
    forwardRef(() => AttemptsModule), 
    AuthModule,
    TypeOrmModule.forFeature([TestAttempt])
  ],
  providers: [AssessmentElasticsearchService],
  exports: [AssessmentElasticsearchService],
})
export class ElasticsearchModule {} 