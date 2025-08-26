import { Test, TestingModule } from '@nestjs/testing';
import { FsLoggerService } from './fs-logger.service';
import { ConsoleLogger } from '@nestjs/common';

describe('FsLoggerService', () => {
  let service: FsLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FsLoggerService],
    }).compile();

    service = module.get<FsLoggerService>(FsLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend ConsoleLogger', () => {
    expect(service).toBeInstanceOf(ConsoleLogger);
  });

  describe('debug', () => {
    it('should call super.debug with message and context when context is provided', () => {
      const debugSpy = jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation();
      const message = 'Debug message';
      const context = 'TestContext';

      service.debug(message, context);

      expect(debugSpy).toHaveBeenCalledWith(message, context);
      debugSpy.mockRestore();
    });

    it('should call super.debug with only message when context is not provided', () => {
      const debugSpy = jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation();
      const message = 'Debug message';

      service.debug(message);

      expect(debugSpy).toHaveBeenCalledWith(message);
      debugSpy.mockRestore();
    });

    it('should call super.debug with only message when context is empty string', () => {
      const debugSpy = jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation();
      const message = 'Debug message';

      service.debug(message, '');

      expect(debugSpy).toHaveBeenCalledWith(message);
      debugSpy.mockRestore();
    });

    it('should handle object messages', () => {
      const debugSpy = jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation();
      const message = { key: 'value', number: 123 };
      const context = 'TestContext';

      service.debug(message, context);

      expect(debugSpy).toHaveBeenCalledWith(message, context);
      debugSpy.mockRestore();
    });
  });

  describe('log', () => {
    it('should call super.log with message and context when context is provided', () => {
      const logSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
      const message = 'Log message';
      const context = 'TestContext';

      service.log(message, context);

      expect(logSpy).toHaveBeenCalledWith(message, context);
      logSpy.mockRestore();
    });

    it('should call super.log with only message when context is not provided', () => {
      const logSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
      const message = 'Log message';

      service.log(message);

      expect(logSpy).toHaveBeenCalledWith(message);
      logSpy.mockRestore();
    });

    it('should call super.log with only message when context is empty string', () => {
      const logSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
      const message = 'Log message';

      service.log(message, '');

      expect(logSpy).toHaveBeenCalledWith(message);
      logSpy.mockRestore();
    });

    it('should handle array messages', () => {
      const logSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
      const message = ['item1', 'item2', 'item3'];
      const context = 'TestContext';

      service.log(message, context);

      expect(logSpy).toHaveBeenCalledWith(message, context);
      logSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should call super.error with message and context when context is provided', () => {
      const errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
      const message = 'Error message';
      const context = 'TestContext';

      service.error(message, context);

      expect(errorSpy).toHaveBeenCalledWith(message, context);
      errorSpy.mockRestore();
    });

    it('should call super.error with only message when context is not provided', () => {
      const errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
      const message = 'Error message';

      service.error(message);

      expect(errorSpy).toHaveBeenCalledWith(message);
      errorSpy.mockRestore();
    });

    it('should call super.error with only message when context is empty string', () => {
      const errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
      const message = 'Error message';

      service.error(message, '');

      expect(errorSpy).toHaveBeenCalledWith(message);
      errorSpy.mockRestore();
    });

    it('should handle Error objects', () => {
      const errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
      const message = new Error('Test error');
      const context = 'TestContext';

      service.error(message, context);

      expect(errorSpy).toHaveBeenCalledWith(message, context);
      errorSpy.mockRestore();
    });

    it('should handle null and undefined messages', () => {
      const errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();

      service.error(null);
      service.error(undefined);

      expect(errorSpy).toHaveBeenCalledWith(null);
      expect(errorSpy).toHaveBeenCalledWith(undefined);
      errorSpy.mockRestore();
    });
  });
});