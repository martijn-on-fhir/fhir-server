import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { HealthCheckService, MemoryHealthIndicator, MongooseHealthIndicator, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';

describe('AppController', () => {
  let controller: AppController;
  let mockHealthCheckService: jest.Mocked<HealthCheckService>;
  let mockMemoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;
  let mockMongooseHealthIndicator: jest.Mocked<MongooseHealthIndicator>;

  beforeEach(async () => {
    mockHealthCheckService = {
      check: jest.fn()
    } as any;

    mockMemoryHealthIndicator = {
      checkHeap: jest.fn(),
      checkRSS: jest.fn()
    } as any;

    mockMongooseHealthIndicator = {
      pingCheck: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator
        },
        {
          provide: MongooseHealthIndicator,
          useValue: mockMongooseHealthIndicator
        }
      ]
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('version', () => {
    it('should return FHIR version string', () => {
      const result = controller.version();

      expect(result).toBe('Fhir 4.0.0');
    });
  });

  describe('healthcheck', () => {
    it('should return ok status', () => {
      const result = controller.healthcheck();

      expect(result).toBe('ok');
    });
  });

  describe('memoryCheck', () => {
    it('should perform memory heap check with correct threshold', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {
          memory_heap: {
            status: 'up',
            used_bytes: 100 * 1024 * 1024,
            limit_bytes: 150 * 1024 * 1024
          }
        },
        error: {},
        details: {}
      };

      const mockHealthIndicatorResult: HealthIndicatorResult = {
        memory_heap: {
          status: 'up',
          used_bytes: 100 * 1024 * 1024,
          limit_bytes: 150 * 1024 * 1024
        }
      };

      mockMemoryHealthIndicator.checkHeap.mockResolvedValue(mockHealthIndicatorResult);
      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.memoryCheck();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function)
      ]);
      expect(result).toEqual(mockResult);
      expect(result.status).toBe('ok');
    });

    it('should call memory heap check with correct parameters', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {}
      };

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await checks[0]();
        return mockResult;
      });

      await controller.memoryCheck();

      expect(mockMemoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024
      );
    });

    it('should handle memory check failure', async () => {
      const mockResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          memory_heap: {
            status: 'down',
            message: 'Memory usage exceeds threshold'
          }
        },
        details: {}
      };

      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.memoryCheck();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('checkRSS', () => {
    it('should perform RSS memory check with correct threshold', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {
          memory_rss: {
            status: 'up',
            used_bytes: 120 * 1024 * 1024,
            limit_bytes: 150 * 1024 * 1024
          }
        },
        error: {},
        details: {}
      };

      const mockHealthIndicatorResult: HealthIndicatorResult = {
        memory_rss: {
          status: 'up',
          used_bytes: 120 * 1024 * 1024,
          limit_bytes: 150 * 1024 * 1024
        }
      };

      mockMemoryHealthIndicator.checkRSS.mockResolvedValue(mockHealthIndicatorResult);
      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.checkRSS();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function)
      ]);
      expect(result).toEqual(mockResult);
      expect(result.status).toBe('ok');
    });

    it('should call RSS check with correct parameters', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {}
      };

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await checks[0]();
        return mockResult;
      });

      await controller.checkRSS();

      expect(mockMemoryHealthIndicator.checkRSS).toHaveBeenCalledWith(
        'memory_rss',
        150 * 1024 * 1024
      );
    });

    it('should handle RSS check failure', async () => {
      const mockResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          memory_rss: {
            status: 'down',
            message: 'RSS memory usage exceeds threshold'
          }
        },
        details: {}
      };

      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.checkRSS();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('databaseCheck', () => {
    it('should perform database connectivity check', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {
          mongoose: {
            status: 'up',
            message: 'Connection is available'
          }
        },
        error: {},
        details: {}
      };

      const mockHealthIndicatorResult: HealthIndicatorResult<'mongoose'> = {
        mongoose: {
          status: 'up',
          message: 'Connection is available'
        }
      };

      mockMongooseHealthIndicator.pingCheck.mockResolvedValue(mockHealthIndicatorResult);
      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.databaseCheck();

      expect(mockHealthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function)
      ]);
      expect(result).toEqual(mockResult);
      expect(result.status).toBe('ok');
    });

    it('should call mongoose ping check with correct parameter', async () => {
      const mockResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {}
      };

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await checks[0]();
        return mockResult;
      });

      await controller.databaseCheck();

      expect(mockMongooseHealthIndicator.pingCheck).toHaveBeenCalledWith('mongoose');
    });

    it('should handle database check failure', async () => {
      const mockResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          mongoose: {
            status: 'down',
            message: 'Database connection failed'
          }
        },
        details: {}
      };

      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.databaseCheck();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });

    it('should handle database connection timeout', async () => {
      const mockResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          mongoose: {
            status: 'down',
            message: 'Database ping timeout'
          }
        },
        details: {}
      };

      mockMongooseHealthIndicator.pingCheck.mockRejectedValue(new Error('Timeout'));
      mockHealthCheckService.check.mockResolvedValue(mockResult);

      const result = await controller.databaseCheck();

      expect(result.status).toBe('error');
    });
  });

  describe('constructor', () => {
    it('should create controller with all dependencies', () => {
      expect(controller).toBeDefined();
      expect((controller as any).health).toBe(mockHealthCheckService);
      expect((controller as any).memory).toBe(mockMemoryHealthIndicator);
      expect((controller as any).mongoose).toBe(mockMongooseHealthIndicator);
    });
  });

  describe('integration scenarios', () => {
    it('should handle all health checks returning healthy status', async () => {
      const healthyResult: HealthCheckResult = {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          mongoose: { status: 'up' }
        },
        error: {},
        details: {}
      };

      mockHealthCheckService.check.mockResolvedValue(healthyResult);

      const [memoryResult, rssResult, dbResult] = await Promise.all([
        controller.memoryCheck(),
        controller.checkRSS(),
        controller.databaseCheck()
      ]);

      expect(memoryResult.status).toBe('ok');
      expect(rssResult.status).toBe('ok');
      expect(dbResult.status).toBe('ok');
    });

    it('should work with actual memory thresholds', async () => {
      const threshold = 150 * 1024 * 1024; // 150MB
      
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await checks[0]();
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      await controller.memoryCheck();
      await controller.checkRSS();

      expect(mockMemoryHealthIndicator.checkHeap).toHaveBeenCalledWith('memory_heap', threshold);
      expect(mockMemoryHealthIndicator.checkRSS).toHaveBeenCalledWith('memory_rss', threshold);
    });
  });
});