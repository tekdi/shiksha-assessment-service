import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './modules/health/health.module';
import { TestsModule } from './modules/tests/tests.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { AuthModule } from './modules/auth/auth.module';
import { PluginModule } from './modules/plugins/plugin.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';
import { CloudStorageModule } from '@vinayak-patil/cloud-storage';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Cache
    CacheModule.registerAsync({
      useClass: RedisConfig,
      isGlobal: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Event emitter for plugins
    EventEmitterModule.forRoot({
      global: true,
    }),

    // Cloud Storage Module - conditionally imported
    ...(process.env.CLOUD_STORAGE_PROVIDER &&
    process.env.CLOUD_STORAGE_PROVIDER.trim()
      ? [
          CloudStorageModule.register({
            provider: process.env.CLOUD_STORAGE_PROVIDER.trim() as
              | 'aws'
              | 'azure'
              | 'gcp',
            region: process.env.CLOUD_STORAGE_REGION?.trim(),
            credentials: {
              accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY_ID?.trim(),
              secretAccessKey:
                process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY?.trim(),
            },
            bucket: process.env.CLOUD_STORAGE_BUCKET_NAME?.trim(),
          }),
        ]
      : []),
    HealthModule,
    AuthModule,
    TestsModule,
    QuestionsModule,
    AttemptsModule,
    PluginModule,
    AssessmentModule,
    ElasticsearchModule,
  ],
})
export class AppModule {}
