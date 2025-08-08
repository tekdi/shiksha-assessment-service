import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Test } from '../modules/tests/entities/test.entity';
import { TestSection } from '../modules/tests/entities/test-section.entity';
import { TestQuestion } from '../modules/tests/entities/test-question.entity';
import { TestAttempt } from '../modules/tests/entities/test-attempt.entity';
import { TestRule } from '../modules/tests/entities/test-rule.entity';
import { TestUserAnswer } from '../modules/tests/entities/test-user-answer.entity';
import { Question } from '../modules/questions/entities/question.entity';
import { QuestionOption } from '../modules/questions/entities/question-option.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_DATABASE', 'assessment_db'),
      entities: [
        Test,
        TestSection,
        TestQuestion,
        TestAttempt,
        TestRule,
        TestUserAnswer,
        Question,
        QuestionOption,
      ],
      synchronize: false,
      autoLoadEntities: true,
      logging: isDevelopment,
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
} 