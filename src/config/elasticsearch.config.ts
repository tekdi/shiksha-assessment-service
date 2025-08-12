import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SHARED_ELASTICSEARCH_CONFIG = {
  indexName: 'users',
  node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME || '',
  password: process.env.ELASTICSEARCH_PASSWORD || '',
};

@Injectable()
export class ElasticsearchConfig {
  constructor(private configService: ConfigService) {}

  getConfig() {
    return {
      indexName: this.configService.get('ELASTICSEARCH_INDEX', 'users'),
      node: this.configService.get('ELASTICSEARCH_HOST', 'http://localhost:9200'),
      username: this.configService.get('ELASTICSEARCH_USERNAME', ''),
      password: this.configService.get('ELASTICSEARCH_PASSWORD', ''),
    };
  }
} 