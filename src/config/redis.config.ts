import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Injectable()
export class RedisConfig implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {

    const logger = new Logger('CacheModule');
    const cacheEnabled = this.configService.get('CACHE_ENABLED') === 'true';

    if (!cacheEnabled) {
      logger.log('Cache is disabled, using memory store');
      return { ttl: 300, max: 1000 };
    }
    return {
      store: redisStore,
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      password: this.configService.get('REDIS_PASSWORD'),
      database: this.configService.get('REDIS_DB', 0),
      ttl: 86400, // 1 day default TTL
      max: 100, // maximum number of items in cache
    };
  }
} 