import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { ElasticsearchModule } from '../../elasticsearch/elasticsearch.module';

@Module({
  imports: [ElasticsearchModule],
  controllers: [AssessmentController],
  exports: [],
})
export class AssessmentModule {} 