import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizerGuard } from './authorizer.guard';
import * as jose from 'jose';

// Mock the jose library
jest.mock('jose', () => ({
  decodeJwt: jest.fn()
}));

describe('AuthorizerGuard', () => {
  let guard: AuthorizerGuard;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: any;

  beforeEach(async () => {
    // Create mock ConfigService
    const mockConfig = {
      get: jest.fn()
    };

    // Create mock request getter
    const mockGetRequest = jest.fn();

    // Create mock ExecutionContext
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: mockGetRequest
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizerGuard,
        {
          provide: ConfigService,
          useValue: mockConfig
        }
      ]
    }).compile();

    guard = module.get<AuthorizerGuard>(AuthorizerGuard);
    mockConfigService = module.get(ConfigService);
    mockExecutionContext = mockContext as any;

    // Create mock request object
    mockRequest = {
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      }
    };

    // Setup the mock to return the mock request
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Dependencies', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
      expect(mockConfigService).toBeDefined();
    });

    it('should inject ConfigService', () => {
      expect(guard['_config']).toBe(mockConfigService);
    });
  });

  describe('canActivate - OAuth Disabled', () => {
    it('should return true when OAuth is explicitly disabled', () => {
      mockConfigService.get.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(result).toBe(true);
    });

    it('should return true when OAuth config is undefined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(result).toBe(true);
    });

    it('should return true when OAuth config is null', () => {
      mockConfigService.get.mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(result).toBe(true);
    });

    it('should return true for non-boolean truthy values', () => {
      const truthyValues = ['true', 1, {}, []];

      truthyValues.forEach(value => {
        mockConfigService.get.mockReturnValue(value);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        jest.clearAllMocks();
      });
    });
  });

  describe('canActivate - OAuth Enabled', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(true);
    });

    describe('Valid JWT Token Scenarios', () => {
      it('should return true for valid unexpired token', () => {
        const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
        const mockDecodedJwt = {
          exp: futureTimestamp,
          sub: 'user123',
          iat: Math.floor(Date.now() / 1000)
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(result).toBe(true);
      });

      it('should handle token with far future expiration', () => {
        const farFutureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours in the future
        const mockDecodedJwt = {
          exp: farFutureTimestamp,
          sub: 'user123',
          aud: 'fhir-server'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });

      it('should handle token with minimal valid claims', () => {
        const futureTimestamp = Math.floor(Date.now() / 1000) + 300; // 5 minutes in the future
        const mockDecodedJwt = {
          exp: futureTimestamp
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });

      it('should work with different authorization header formats', () => {
        const testCases = [
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
          'bearer lowercase-token',
          'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        ];

        testCases.forEach(authHeader => {
          mockRequest.headers.authorization = authHeader;
          
          const futureTimestamp = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
          const mockDecodedJwt = { exp: futureTimestamp };
          
          (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

          const result = guard.canActivate(mockExecutionContext);

          expect(jose.decodeJwt).toHaveBeenCalledWith(authHeader);
          expect(result).toBe(true);
          
          jest.clearAllMocks();
          mockConfigService.get.mockReturnValue(true);
        });
      });
    });

    describe('Expired JWT Token Scenarios', () => {
      it('should return false for expired token', () => {
        const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const mockDecodedJwt = {
          exp: pastTimestamp,
          sub: 'user123',
          iat: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(result).toBe(false);
      });

      it('should return false for token expired by 1 second', () => {
        const pastTimestamp = Math.floor(Date.now() / 1000) - 1; // 1 second ago
        const mockDecodedJwt = {
          exp: pastTimestamp,
          sub: 'user123'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false for token with exp equal to current time', () => {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const mockDecodedJwt = {
          exp: currentTimestamp,
          sub: 'user123'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should handle very old expired tokens', () => {
        const veryOldTimestamp = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago
        const mockDecodedJwt = {
          exp: veryOldTimestamp,
          sub: 'user123'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });
    });

    describe('Invalid JWT Token Scenarios', () => {
      it('should return false when jose.decodeJwt returns null', () => {
        (jose.decodeJwt as jest.Mock).mockReturnValue(null);

        const result = guard.canActivate(mockExecutionContext);

        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(result).toBe(false);
      });

      it('should return false when jose.decodeJwt returns undefined', () => {
        (jose.decodeJwt as jest.Mock).mockReturnValue(undefined);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false when decoded JWT has no exp claim', () => {
        const mockDecodedJwt = {
          sub: 'user123',
          iat: Math.floor(Date.now() / 1000)
          // Missing exp claim
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false when exp claim is not a number', () => {
        const mockDecodedJwt = {
          exp: 'not-a-number',
          sub: 'user123'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false when exp claim is null', () => {
        const mockDecodedJwt = {
          exp: null,
          sub: 'user123'
        };

        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should handle jose.decodeJwt throwing an error', () => {
        (jose.decodeJwt as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid JWT format');
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow('Invalid JWT format');
        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      });

      it('should handle malformed JWT tokens', () => {
        mockRequest.headers.authorization = 'Bearer invalid.jwt.token';
        
        (jose.decodeJwt as jest.Mock).mockImplementation(() => {
          throw new Error('JWT malformed');
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow('JWT malformed');
      });
    });

    describe('Missing Authorization Header Scenarios', () => {
      it('should return false when authorization header is missing', () => {
        mockRequest.headers = {}; // No authorization header

        const result = guard.canActivate(mockExecutionContext);

        expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
        expect(jose.decodeJwt).not.toHaveBeenCalled();
        expect(result).toBe(false);
      });

      it('should return false when authorization header is empty string', () => {
        mockRequest.headers.authorization = '';

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false when authorization header is null', () => {
        mockRequest.headers.authorization = null;

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should return false when authorization header is undefined', () => {
        mockRequest.headers.authorization = undefined;

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(false);
      });

      it('should throw error when headers object is undefined', () => {
        mockRequest = { headers: undefined };
        (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

        expect(() => guard.canActivate(mockExecutionContext)).toThrow();
      });
    });

    describe('Configuration Edge Cases', () => {
      it('should handle strict boolean comparison for enabled state', () => {
        const testCases = [
          { configValue: true, expectedResult: false }, // false because no valid token
          { configValue: false, expectedResult: true },
          { configValue: 'true', expectedResult: true },
          { configValue: 1, expectedResult: true },
          { configValue: 0, expectedResult: true }
        ];

        testCases.forEach(({ configValue, expectedResult }) => {
          jest.clearAllMocks();
          mockConfigService.get.mockReturnValue(configValue);

          // Reset request to have no authorization header for this test
          mockRequest.headers = {};
          (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

          const result = guard.canActivate(mockExecutionContext);

          expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
          expect(result).toBe(expectedResult);
        });
      });

      it('should handle config service errors gracefully', () => {
        mockConfigService.get.mockImplementation(() => {
          throw new Error('Configuration service unavailable');
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow('Configuration service unavailable');
        expect(jose.decodeJwt).not.toHaveBeenCalled();
      });
    });

    describe('Request Context Handling', () => {
      it('should handle different execution contexts', () => {
        const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
        const mockDecodedJwt = { exp: futureTimestamp };

        // Test with different mock requests
        const customRequest = {
          headers: {
            authorization: 'Bearer different.jwt.token'
          }
        };

        (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(customRequest);
        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(mockExecutionContext.switchToHttp().getRequest).toHaveBeenCalled();
        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer different.jwt.token');
        expect(result).toBe(true);
      });

      it('should handle request extraction errors', () => {
        (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockImplementation(() => {
          throw new Error('Failed to extract request');
        });

        expect(() => guard.canActivate(mockExecutionContext)).toThrow('Failed to extract request');
      });

      it('should handle authorization header access by exact key', () => {
        // The current implementation accesses headers['authorization'] specifically
        const customRequest = {
          headers: {
            authorization: 'Bearer test.token',
            'content-type': 'application/json'
          }
        };

        (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(customRequest);
        
        const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
        const mockDecodedJwt = { exp: futureTimestamp };
        (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer test.token');
      });
    });
  });

  describe('Token Expiration Edge Cases', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(true);
    });

    it('should handle floating point timestamps', () => {
      const futureTimestamp = Date.now() / 1000 + 300.5; // 5.5 minutes in the future
      const mockDecodedJwt = {
        exp: futureTimestamp,
        sub: 'user123'
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle very large timestamp values', () => {
      const largeTimestamp = 2147483647; // Max 32-bit signed integer (year 2038)
      const mockDecodedJwt = {
        exp: largeTimestamp,
        sub: 'user123'
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle zero timestamp', () => {
      const mockDecodedJwt = {
        exp: 0,
        sub: 'user123'
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false); // 0 is definitely in the past
    });

    it('should handle negative timestamp', () => {
      const mockDecodedJwt = {
        exp: -1000,
        sub: 'user123'
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical authorized request scenario', () => {
      mockConfigService.get.mockReturnValue(true);

      const typicalRequest = {
        headers: {
          authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
          accept: 'application/fhir+json'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(typicalRequest);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const mockDecodedJwt = {
        sub: '1234567890',
        name: 'John Doe',
        admin: true,
        exp: futureTimestamp,
        iat: Math.floor(Date.now() / 1000)
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockDecodedJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(jose.decodeJwt).toHaveBeenCalledWith(typicalRequest.headers.authorization);
    });

    it('should work correctly in a typical unauthorized request scenario', () => {
      mockConfigService.get.mockReturnValue(true);

      const unauthorizedRequest = {
        headers: {
          accept: 'application/fhir+json'
          // Missing authorization header
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(unauthorizedRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(jose.decodeJwt).not.toHaveBeenCalled();
    });

    it('should bypass authorization in development environment', () => {
      // Simulate development environment where OAuth is disabled
      mockConfigService.get.mockReturnValue(false);

      const devRequest = {
        headers: {
          accept: 'application/fhir+json'
          // No authorization header needed
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(devRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(jose.decodeJwt).not.toHaveBeenCalled();
    });

    it('should handle production environment with expired token', () => {
      mockConfigService.get.mockReturnValue(true);

      const productionRequest = {
        headers: {
          authorization: 'Bearer expired.jwt.token',
          'user-agent': 'FHIR-Client/1.0'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(productionRequest);

      const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockExpiredJwt = {
        sub: 'user456',
        exp: expiredTimestamp
      };

      (jose.decodeJwt as jest.Mock).mockReturnValue(mockExpiredJwt);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.oauth.enabled');
      expect(jose.decodeJwt).toHaveBeenCalledWith('Bearer expired.jwt.token');
    });
  });
});