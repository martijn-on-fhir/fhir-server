import { HttpException, HttpStatus } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import configuration from './configuration';

// Mock the fs module
jest.mock('fs');
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

// Mock the path module
jest.mock('path');
const mockResolve = resolve as jest.MockedFunction<typeof resolve>;

describe('Configuration', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset process.env
    process.env = { ...originalProcessEnv };
    
    // Default mock implementations
    mockResolve.mockImplementation((dir: string, file: string) => `${dir}/${file}`);
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalProcessEnv;
  });

  describe('successful configuration loading', () => {
    it('should load configuration for local environment', () => {
      const mockConfig = {
        mongodb: {
          host: 'localhost',
          port: 27017,
          database: 'fhir-server'
        },
        authorization: {
          oauth: {
            enabled: false
          }
        }
      };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configuration();

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/local.json');
      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('local.json'));
      expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('local.json'), 'utf8');
      expect(result).toEqual(mockConfig);
    });

    it('should load configuration for development environment', () => {
      const mockConfig = {
        mongodb: {
          host: 'dev-mongo.example.com',
          port: 27017,
          database: 'fhir-dev'
        },
        authorization: {
          oauth: {
            enabled: true,
            introspect: 'https://oauth.dev.example.com/introspect'
          }
        }
      };
      
      process.env.ENV_NAME = 'dev';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configuration();

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/dev.json');
      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('dev.json'));
      expect(result).toEqual(mockConfig);
    });

    it('should load configuration for production environment', () => {
      const mockConfig = {
        mongodb: {
          host: 'prod-mongo.example.com',
          port: 27017,
          database: 'fhir-prod'
        },
        authorization: {
          oauth: {
            enabled: true,
            introspect: 'https://oauth.prod.example.com/introspect'
          }
        },
        terminology: {
          enabled: true,
          baseUrl: 'https://terminologieserver.nl'
        }
      };
      
      process.env.ENV_NAME = 'prd';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configuration();

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/prd.json');
      expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('prd.json'));
      expect(result).toEqual(mockConfig);
    });

    it('should load configuration for acceptance environment', () => {
      const mockConfig = {
        mongodb: {
          host: 'acc-mongo.example.com',
          port: 27017,
          database: 'fhir-acc'
        }
      };
      
      process.env.ENV_NAME = 'acc';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configuration();

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/acc.json');
      expect(result).toEqual(mockConfig);
    });

    it('should handle complex nested configuration objects', () => {
      const complexConfig = {
        mongodb: {
          host: 'localhost',
          port: 27017,
          database: 'fhir-server',
          options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10
          }
        },
        authorization: {
          oauth: {
            enabled: true,
            introspect: 'https://oauth.example.com/introspect',
            scopes: ['read', 'write', 'admin']
          },
          smartOnFhir: {
            enabled: true,
            clientId: 'test-client',
            redirectUri: 'http://localhost:3000/callback'
          }
        },
        cron: {
          metrics: { enabled: true, interval: '*/5 * * * *' },
          backup: { enabled: false, directory: './export' }
        }
      };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(complexConfig));

      const result = configuration();

      expect(result).toEqual(complexConfig);
    });

    it('should handle empty configuration object', () => {
      const emptyConfig = {};
      
      process.env.ENV_NAME = 'test';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(emptyConfig));

      const result = configuration();

      expect(result).toEqual(emptyConfig);
    });
  });

  describe('error handling', () => {
    it('should throw HttpException when config file does not exist', () => {
      process.env.ENV_NAME = 'nonexistent';
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockReturnValue('/path/to/config/nonexistent.json');

      expect(() => configuration()).toThrow(HttpException);
      expect(() => configuration()).toThrow('Config file /path/to/config/nonexistent.json not found');
      
      try {
        configuration();
        fail('Expected HttpException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(error.message).toBe('Config file /path/to/config/nonexistent.json not found');
        // The HttpException constructor's third parameter is options, not cause
        // We can't easily test the internal options object, so we'll skip this assertion
      }
    });

    it('should throw HttpException with correct file path for missing dev config', () => {
      process.env.ENV_NAME = 'dev';
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockReturnValue('/app/config/dev.json');

      expect(() => configuration()).toThrow('Config file /app/config/dev.json not found');
    });

    it('should throw HttpException with correct file path for missing prod config', () => {
      process.env.ENV_NAME = 'prd';
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockReturnValue('/app/config/prd.json');

      expect(() => configuration()).toThrow('Config file /app/config/prd.json not found');
    });

    it('should handle undefined ENV_NAME gracefully', () => {
      delete process.env.ENV_NAME;
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockReturnValue('/path/to/config/undefined.json');

      expect(() => configuration()).toThrow(HttpException);
      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/undefined.json');
    });

    it('should handle empty ENV_NAME gracefully', () => {
      process.env.ENV_NAME = '';
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockReturnValue('/path/to/config/.json');

      expect(() => configuration()).toThrow(HttpException);
      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/.json');
    });
  });

  describe('JSON parsing', () => {
    it('should handle malformed JSON gracefully', () => {
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{ invalid json }');

      expect(() => configuration()).toThrow();
    });

    it('should parse JSON with whitespace and formatting', () => {
      const configWithWhitespace = `
      {
        "mongodb": {
          "host": "localhost",
          "port": 27017
        }
      }
      `;
      const expectedConfig = {
        mongodb: {
          host: 'localhost',
          port: 27017
        }
      };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(configWithWhitespace);

      const result = configuration();

      expect(result).toEqual(expectedConfig);
    });

    it('should handle JSON with various data types', () => {
      const configWithTypes = {
        stringValue: 'test',
        numberValue: 123,
        booleanValue: true,
        nullValue: null,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' }
      };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithTypes));

      const result = configuration();

      expect(result).toEqual(configWithTypes);
    });
  });

  describe('file system operations', () => {
    it('should use correct path resolution', () => {
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(false);
      
      // Mock __dirname to a specific value for testing
      mockResolve.mockImplementation((dirname, relativePath) => {
        if (dirname.includes('src/config') && relativePath === '../../../config/local.json') {
          return '/app/config/local.json';
        }

        return `${dirname}/${relativePath}`;
      });

      expect(() => configuration()).toThrow();
      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/local.json');
    });

    it('should handle file read with utf8 encoding', () => {
      const mockConfig = { test: 'value' };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      configuration();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.any(String),
        'utf8'
      );
    });

    it('should call toString() on file contents', () => {
      const mockConfig = { test: 'value' };
      const mockBuffer = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockConfig))
      };
      
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockBuffer as any);

      const result = configuration();

      expect(mockBuffer.toString).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });
  });

  describe('environment variations', () => {
    const environments = ['local', 'dev', 'acc', 'prd'];

    environments.forEach(env => {
      it(`should load configuration for ${env} environment`, () => {
        const mockConfig = { environment: env, test: true };
        
        process.env.ENV_NAME = env;
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

        const result = configuration();

        expect(mockResolve).toHaveBeenCalledWith(expect.any(String), `../../../config/${env}.json`);
        expect(result).toEqual(mockConfig);
      });
    });

    it('should handle custom environment names', () => {
      const customEnv = 'staging';
      const mockConfig = { environment: customEnv };
      
      process.env.ENV_NAME = customEnv;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configuration();

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), `../../../config/${customEnv}.json`);
      expect(result).toEqual(mockConfig);
    });
  });

  describe('webpack compatibility', () => {
    it('should handle webpack build directory structure', () => {
      // The comment in the original code mentions webpack changes the relative directory
      process.env.ENV_NAME = 'local';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{}');

      configuration();

      // Verify it uses the documented webpack-compatible path
      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '../../../config/local.json');
    });

    it('should resolve paths relative to __dirname correctly', () => {
      process.env.ENV_NAME = 'test';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{}');

      configuration();

      // Ensure resolve is called with __dirname as first parameter
      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('config/test.json'));
      const resolveCall = mockResolve.mock.calls[0];
      expect(resolveCall[0]).toMatch(/src[\\/]config/);
    });
  });
});