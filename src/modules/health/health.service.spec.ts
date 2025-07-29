import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: jest.Mocked<DataSource>;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const mockCacheManager = {
      set: jest.fn(),
      get: jest.fn(),
      store: {
        getClient: jest.fn().mockReturnValue({
          ping: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get(getDataSourceToken());
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return healthy status when both database and redis are healthy', async () => {
      // Mock successful database connection
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      
      // Mock successful Redis ping
      const mockRedisClient = (cacheManager as any).store.getClient();
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.checkHealth();

      expect(result).toMatchObject({
        id: 'api.content.health',
        ver: '3.0',
        params: {
          err: null,
          status: 'successful',
          errmsg: null,
        },
        responseCode: 'OK',
        result: {
          checks: [
            { name: 'postgresql', healthy: true },
            { name: 'redis', healthy: true },
          ],
          healthy: true,
        },
      });
      expect(result.params.resmsgid).toBeDefined();
      expect(result.ts).toBeDefined();
    });

    it('should return failed status when database is unhealthy', async () => {
      // Mock database connection failure
      dataSource.query.mockRejectedValue(new Error('Database connection failed'));
      
      // Mock successful Redis ping
      const mockRedisClient = (cacheManager as any).store.getClient();
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.checkHealth();

      expect(result).toMatchObject({
        id: 'api.content.health',
        ver: '3.0',
        params: {
          err: 'DATABASE_CONNECTION_ERROR',
          status: 'failed',
          errmsg: 'Database connection failed',
        },
        responseCode: 'INTERNAL_ERROR',
        result: {
          checks: [
            { name: 'postgresql', healthy: false },
            { name: 'redis', healthy: true },
          ],
          healthy: false,
        },
      });
    });

    it('should return failed status when redis is unhealthy', async () => {
      // Mock successful database connection
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      
      // Mock Redis ping failure
      const mockRedisClient = (cacheManager as any).store.getClient();
      mockRedisClient.ping.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.checkHealth();

      expect(result).toMatchObject({
        id: 'api.content.health',
        ver: '3.0',
        params: {
          err: 'REDIS_CONNECTION_ERROR',
          status: 'failed',
          errmsg: 'Redis connection failed',
        },
        responseCode: 'INTERNAL_ERROR',
        result: {
          checks: [
            { name: 'postgresql', healthy: true },
            { name: 'redis', healthy: false },
          ],
          healthy: false,
        },
      });
    });

    it('should fallback to cache manager operations when direct redis client is not available', async () => {
      // Mock successful database connection
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      
      // Mock cache manager without direct client access
      (cacheManager as any).store = {};
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('pong');

      const result = await service.checkHealth();

      expect(result.result.checks).toContainEqual({ name: 'redis', healthy: true });
      expect(cacheManager.set).toHaveBeenCalledWith('health_check_ping', 'pong', 10);
      expect(cacheManager.get).toHaveBeenCalledWith('health_check_ping');
    });
  });
});