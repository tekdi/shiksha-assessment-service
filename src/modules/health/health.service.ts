import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import axios, { AxiosError } from 'axios';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down';
  message?: string;
  responseTime?: number;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!this.dataSource) {
        return { name: 'database', status: 'down', message: 'DataSource not available' };
      }

      if (!this.dataSource.isInitialized) {
        return { name: 'database', status: 'down', message: 'Database connection not initialized' };
      }

      const queryPromise = this.dataSource.query('SELECT 1');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000),
      );

      await Promise.race([queryPromise, timeoutPromise]);
      const responseTime = Date.now() - startTime;
      return { name: 'database', status: 'up', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'database',
        status: 'down',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime,
      };
    }
  }

  async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await this.cacheManager.set('health_check', 'ok', 10);
      const result = await this.cacheManager.get('health_check');
      const responseTime = Date.now() - startTime;
      if (result === 'ok') {
        return { name: 'redis', status: 'up', responseTime };
      } else {
        return { name: 'redis', status: 'down', message: 'Redis health check failed', responseTime };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'redis',
        status: 'down',
        message: error instanceof Error ? error.message : 'Redis connection failed',
        responseTime,
      };
    }
  }

  async checkExternalService(serviceName: string, serviceUrl: string | undefined): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    if (!serviceUrl) {
      return { name: serviceName, status: 'down', message: 'Service URL not configured' };
    }

    try {
      // Try to check health endpoint first, fallback to base URL
      const timeout = 3000; // 3 second timeout for external services
      let healthUrl = `${serviceUrl}/health/ready`;
      let response;

      try {
        response = await axios.get(healthUrl, {
          timeout,
          validateStatus: (status) => status < 500, // Accept 2xx, 3xx, 4xx but not 5xx
        });
      } catch {
        // If /health/ready fails, try /health
        try {
          healthUrl = `${serviceUrl}/health`;
          response = await axios.get(healthUrl, {
            timeout,
            validateStatus: (status) => status < 500,
          });
        } catch {
          // If health endpoints don't exist, try base URL connectivity
          await axios.get(serviceUrl, { timeout, validateStatus: () => true });
          return { name: serviceName, status: 'up', responseTime: Date.now() - startTime };
        }
      }

      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 || response.status === 503) {
        // 200 = healthy, 503 = unhealthy but service is reachable
        return {
          name: serviceName,
          status: response.status === 200 ? 'up' : 'down',
          message: response.status === 503 ? 'Service unhealthy' : undefined,
          responseTime,
        };
      }

      // Other status codes - service is reachable
      return { name: serviceName, status: 'up', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          return { name: serviceName, status: 'down', message: 'Service unreachable', responseTime };
        }
      }
      return {
        name: serviceName,
        status: 'down',
        message: error instanceof Error ? error.message : 'Service check failed',
        responseTime,
      };
    }
  }

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
    const dbHealth = await this.checkDatabase();
    healthStatus.services.database = dbHealth.status === 'up' ? 'healthy' : 'unhealthy';
    if (dbHealth.status === 'down') {
      healthStatus.status = 'unhealthy';
    }

    // Check Redis connectivity
    const redisHealth = await this.checkRedis();
    healthStatus.services.redis = redisHealth.status === 'up' ? 'healthy' : 'unhealthy';
    if (redisHealth.status === 'down') {
      healthStatus.status = 'unhealthy';
    }

    return healthStatus;
  }

  async getOverallHealth(): Promise<{ status: 'ok' | 'error'; services: ServiceHealth[] }> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalService('user-service', this.configService.get('USER_SERVICE_URL')),
      this.checkExternalService('lms-service', this.configService.get('LMS_SERVICE_URL')),
    ]);

    const overallStatus = checks.every((check) => check.status === 'up') ? 'ok' : 'error';
    return { status: overallStatus, services: checks };
  }
}
