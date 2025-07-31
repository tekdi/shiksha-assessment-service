import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

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
    
    // Feature modules
    HealthModule,
    AuthModule,
    TestsModule,
    QuestionsModule,
    AttemptsModule,
    PluginModule,
  ],
})
export class AppModule {} 