import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async checkHealth() {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database connectivity
    try {
      await this.dataSource.query('SELECT 1');
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'unhealthy';
    }

    // Check Redis connectivity
    try {
      await this.cacheManager.set('health_check', 'ok', 10);
      const result = await this.cacheManager.get('health_check');
      if (result === 'ok') {
        healthStatus.services.redis = 'healthy';
      } else {
        healthStatus.services.redis = 'unhealthy';
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.status = 'unhealthy';
    }

    return healthStatus;
  }
} 