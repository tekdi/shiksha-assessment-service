import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';

interface HealthCheck {
  name: string;
  healthy: boolean;
}

interface HealthResult {
  checks: HealthCheck[];
  healthy: boolean;
}

interface HealthResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    msgid: null;
    err: string | null;
    status: string;
    errmsg: string | null;
  };
  responseCode: string;
  result: HealthResult;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async checkHealth(): Promise<HealthResponse> {
    const checks: HealthCheck[] = [];
    let overallHealthy = true;
    let errorCode: string | null = null;
    let errorMessage: string | null = null;

    // Check PostgreSQL connectivity
    try {
      await this.dataSource.query('SELECT 1');
      checks.push({ name: 'postgresql', healthy: true });
    } catch (error) {
      checks.push({ name: 'postgresql', healthy: false });
      overallHealthy = false;
      errorCode = 'DATABASE_CONNECTION_ERROR';
      errorMessage = error instanceof Error ? error.message : 'Database connection failed';
    }

    // Check Redis connectivity
    try {
      // Try to access the underlying Redis client for PING command
      const store = (this.cacheManager as any).store;
      if (store && store.getClient) {
        const redisClient = store.getClient();
        await redisClient.ping();
        checks.push({ name: 'redis', healthy: true });
      } else {
        // Fallback to cache manager operations if direct client access isn't available
        await this.cacheManager.set('health_check_ping', 'pong', 10);
        const result = await this.cacheManager.get('health_check_ping');
        if (result === 'pong') {
          checks.push({ name: 'redis', healthy: true });
        } else {
          checks.push({ name: 'redis', healthy: false });
          overallHealthy = false;
          errorCode = errorCode || 'REDIS_CONNECTION_ERROR';
          errorMessage = errorMessage || 'Redis connection failed';
        }
      }
    } catch (error) {
      checks.push({ name: 'redis', healthy: false });
      overallHealthy = false;
      errorCode = errorCode || 'REDIS_CONNECTION_ERROR';
      errorMessage = errorMessage || (error instanceof Error ? error.message : 'Redis connection failed');
    }

    const response: HealthResponse = {
      id: 'api.content.health',
      ver: '3.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv4(),
        msgid: null,
        err: errorCode,
        status: overallHealthy ? 'successful' : 'failed',
        errmsg: errorMessage,
      },
      responseCode: overallHealthy ? 'OK' : 'INTERNAL_ERROR',
      result: {
        checks,
        healthy: overallHealthy,
      },
    };

    return response;
  }
} 