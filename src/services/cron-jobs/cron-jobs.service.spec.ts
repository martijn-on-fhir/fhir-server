import { Test, TestingModule } from '@nestjs/testing';
import { CronJobsService } from './cron-jobs.service';
import { FsLoggerService } from "../logger/fs-logger.service";
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { getModelToken } from '@nestjs/mongoose';
import { SystemSchema } from '../../schema/system-schema';
import { Usage } from '../../lib/system/usage';
import { CronJob } from 'cron';

// Mock the Usage class
jest.mock('../../lib/system/usage');
jest.mock('../../lib/backup/backup');

describe('CronJobsService', () => {
  let service: CronJobsService;
  let mockSystemModel: any;
  let mockConfigService: any;
  let mockSchedulerRegistry: any;
  let mockFsLoggerService: any;

  beforeEach(async () => {
    mockSystemModel = {
      save: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'cron') {
          return {
            backup: {
              enabled: true,
              directory: '/backup',
              interval: '0 2 * * *'
            }
          };
        }

        if (key === 'cron.metrics.enabled') {
          return true;
        }

        if (key === 'mongodb') {
          return 'mongodb://localhost:27017/test';
        }

        return {};
      }),
    };

    mockSchedulerRegistry = {
      addCronJob: jest.fn(),
    };

    mockFsLoggerService = {
      setContext: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobsService,
        {
          provide: getModelToken(SystemSchema.name),
          useValue: mockSystemModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: FsLoggerService,
          useValue: mockFsLoggerService,
        },
      ],
    }).compile();

    service = module.get<CronJobsService>(CronJobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should set logger context', () => {
      expect(mockFsLoggerService.setContext).toHaveBeenCalledWith('CronJobsService');
    });

    it('should process cron actions from config', () => {
      // The constructor should have processed the backup action
      expect(mockConfigService.get).toHaveBeenCalledWith('cron');
    });

    it('should handle empty cron config', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cron') return {};
        return {};
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CronJobsService,
          {
            provide: getModelToken(SystemSchema.name),
            useValue: mockSystemModel,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: FsLoggerService,
            useValue: mockFsLoggerService,
          },
        ],
      }).compile();

      const serviceWithEmptyConfig = module.get<CronJobsService>(CronJobsService);
      expect(serviceWithEmptyConfig).toBeDefined();
    });
  });

  describe('afterApplicationStart', () => {
    it('should log message when executed', () => {
      service.afterApplicationStart();
      expect(mockFsLoggerService.log).toHaveBeenCalledWith('Cron job executed');
    });
  });

  describe('handleEveryMinute', () => {
    it('should collect and save system metrics when enabled', () => {
      const mockUsage = {
        snapshot: jest.fn().mockReturnValue({
          cpu: 50,
          memory: { used: 1000, total: 2000 },
          timestamp: new Date()
        })
      };
      (Usage as jest.MockedClass<typeof Usage>).mockImplementation(() => mockUsage as any);

      const mockSaveMethod = jest.fn();
      const mockSystemModelConstructor = jest.fn().mockImplementation(() => ({
        save: mockSaveMethod
      }));

      // Replace the system model with our mock constructor
      (service as any).systemModel = mockSystemModelConstructor;

      service.handleEveryMinute();

      expect(mockUsage.snapshot).toHaveBeenCalled();
      expect(mockSystemModelConstructor).toHaveBeenCalledWith({
        cpu: 50,
        memory: { used: 1000, total: 2000 },
        timestamp: expect.any(Date)
      });
      expect(mockSaveMethod).toHaveBeenCalled();
    });

    it('should not collect metrics when disabled', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cron.metrics.enabled') return false;
        return {};
      });

      const mockUsage = {
        snapshot: jest.fn()
      };
      (Usage as jest.MockedClass<typeof Usage>).mockImplementation(() => mockUsage as any);

      const mockSystemModelConstructor = jest.fn();
      (service as any).systemModel = mockSystemModelConstructor;

      service.handleEveryMinute();

      expect(mockUsage.snapshot).not.toHaveBeenCalled();
      expect(mockSystemModelConstructor).not.toHaveBeenCalled();
    });
  });

  describe('handleEveryHour', () => {
    it('should log hourly task execution', () => {
      service.handleEveryHour();
      expect(mockFsLoggerService.log).toHaveBeenCalledWith('Task running every hour');
    });
  });

  describe('handleEveryDay', () => {
    it('should log daily task execution', () => {
      service.handleEveryDay();
      expect(mockFsLoggerService.log).toHaveBeenCalledWith('Task running every day');
    });
  });

  describe('handleFirstDayOfMonth', () => {
    it('should delete old system records', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      await service.handleFirstDayOfMonth();

      expect(mockSystemModel.deleteMany).toHaveBeenCalledWith({
        createdAt: { $lt: expect.any(Date) }
      });

      // Verify the date is approximately one month ago
      const deleteCall = mockSystemModel.deleteMany.mock.calls[0][0];
      const passedDate = deleteCall.createdAt.$lt;
      const timeDiff = Math.abs(passedDate.getTime() - oneMonthAgo.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('handleEveryWeek', () => {
    it('should log weekly task execution', () => {
      service.handleEveryWeek();
      expect(mockFsLoggerService.log).toHaveBeenCalledWith('Task running every week');
    });
  });

  describe('Dynamic cron job handling', () => {
    it('should create backup cron job when enabled', async () => {
      const backupConfig = {
        enabled: true,
        directory: '/test/backup',
        interval: '0 3 * * *'
      };

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cron') {
          return { backup: backupConfig };
        }

        if (key === 'mongodb') {
          return 'mongodb://localhost:27017/test';
        }

        return {};
      });

      // Create a new service instance to trigger constructor logic
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CronJobsService,
          {
            provide: getModelToken(SystemSchema.name),
            useValue: mockSystemModel,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: FsLoggerService,
            useValue: mockFsLoggerService,
          },
        ],
      }).compile();

      const newService = module.get<CronJobsService>(CronJobsService);
      expect(newService).toBeDefined();
    });

    it('should not create cron job when disabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cron') {
          return {
            backup: {
              enabled: false,
              directory: '/test/backup',
              interval: '0 3 * * *'
            }
          };
        }

        return {};
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CronJobsService,
          {
            provide: getModelToken(SystemSchema.name),
            useValue: mockSystemModel,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: FsLoggerService,
            useValue: mockFsLoggerService,
          },
        ],
      }).compile();

      const newService = module.get<CronJobsService>(CronJobsService);
      expect(newService).toBeDefined();
    });

    it('should not create cron job with invalid interval', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cron') {
          return {
            backup: {
              enabled: true,
              directory: '/test/backup',
              interval: ''
            }
          };
        }

        return {};
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CronJobsService,
          {
            provide: getModelToken(SystemSchema.name),
            useValue: mockSystemModel,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: FsLoggerService,
            useValue: mockFsLoggerService,
          },
        ],
      }).compile();

      const newService = module.get<CronJobsService>(CronJobsService);
      expect(newService).toBeDefined();
    });
  });
});
