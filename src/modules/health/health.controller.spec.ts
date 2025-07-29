import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

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
      controllers: [HealthController],
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

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('/health endpoint', () => {
    it('should return health check response', async () => {
      const mockResponse = {
        id: 'api.content.health',
        ver: '3.0',
        ts: '2023-11-02T10:33:23.321Z',
        params: {
          resmsgid: 'test-uuid',
          msgid: null,
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
      };

      jest.spyOn(service, 'checkHealth').mockResolvedValue(mockResponse);

      const result = await controller.checkHealth();

      expect(result).toEqual(mockResponse);
      expect(service.checkHealth).toHaveBeenCalled();
    });
  });

  describe('/healthz endpoint', () => {
    it('should return health check response', async () => {
      const mockResponse = {
        id: 'api.content.health',
        ver: '3.0',
        ts: '2023-11-02T10:33:23.321Z',
        params: {
          resmsgid: 'test-uuid',
          msgid: null,
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
      };

      jest.spyOn(service, 'checkHealth').mockResolvedValue(mockResponse);

      const result = await controller.checkHealthz();

      expect(result).toEqual(mockResponse);
      expect(service.checkHealth).toHaveBeenCalled();
    });
  });

  describe('both endpoints should use same handler', () => {
    it('should call the same service method for both /health and /healthz', async () => {
      const spy = jest.spyOn(service, 'checkHealth').mockResolvedValue({} as any);

      await controller.checkHealth();
      await controller.checkHealthz();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});