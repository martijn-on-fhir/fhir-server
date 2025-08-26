import { Test, TestingModule } from '@nestjs/testing';
import { CronJobsService } from './cron-jobs.service';
import { FsLoggerService } from "../logger/fs-logger.service";
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { getModelToken } from '@nestjs/mongoose';
import { SystemSchema } from '../../schema/system-schema';

describe('CronJobsService', () => {
  let service: CronJobsService;

  const mockSystemModel = {
    save: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'cron') {
        return {};
      }

      return {
        metrics: { enabled: false },
        backup: { enabled: false }
      };
    }),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
  };

  const mockFsLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
