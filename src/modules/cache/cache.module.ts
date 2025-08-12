import { Module, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheConfigService } from './cache-config.service';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const cacheEnabled = configService.get('CACHE_ENABLED') === 'true';

        if (!cacheEnabled) {
          logger.log('Cache is disabled, using memory store');
          return {
            ttl: 300,
            max: 1000,
          } as any;
        }

        const redisOptions = {
          socket: {
            host: configService.get('REDIS_HOST'),
            port: Number(configService.get('REDIS_PORT') || '6379'),
          },
          password: configService.get('REDIS_PASSWORD') || '',
          database: Number(configService.get('REDIS_DB') || '0'),
        };

        logger.log(
          `Connecting to Redis at ${redisOptions.socket.host}:${redisOptions.socket.port}`
        );

        const store = await redisStore(redisOptions);
        return {
          store,
          ttl: Number(configService.get('CACHE_DEFAULT_TTL') || 3600),
        } as any;
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService, CacheConfigService],
  exports: [CacheService, CacheConfigService],
})
export class CacheModule {}