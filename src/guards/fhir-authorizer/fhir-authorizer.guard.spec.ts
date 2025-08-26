import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FhirAuthorizerGuard } from './fhir-authorizer.guard';
import { FhirScopeAuthorization } from '../../lib/authorization/fhir-scope-authorization';
import { AccessDecision } from '../../interfaces/access-decision';
import { IncomingMessage } from 'http';

// Mock the FhirScopeAuthorization to avoid jose dependency issues
jest.mock('../../lib/authorization/fhir-scope-authorization', () => {
  return {
    FhirScopeAuthorization: jest.fn().mockImplementation(() => ({
      authorize: jest.fn()
    }))
  };
});

describe('FhirAuthorizerGuard', () => {
  let guard: FhirAuthorizerGuard;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockFhirScopeAuthorization: jest.Mocked<FhirScopeAuthorization>;
  let mockRequest: Partial<IncomingMessage>;

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
        FhirAuthorizerGuard,
        {
          provide: ConfigService,
          useValue: mockConfig
        }
      ]
    }).compile();

    guard = module.get<FhirAuthorizerGuard>(FhirAuthorizerGuard);
    mockConfigService = module.get(ConfigService);
    mockExecutionContext = mockContext as any;

    // Mock the FhirScopeAuthorization instance
    mockFhirScopeAuthorization = guard.authorizer as jest.Mocked<FhirScopeAuthorization>;

    // Create mock request object
    mockRequest = {
      method: 'GET',
      url: '/fhir/Patient',
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
      expect(guard.authorizer).toBeDefined();
      expect(mockConfigService).toBeDefined();
    });

    it('should create FhirScopeAuthorization instance', () => {
      expect(guard.authorizer).toBeDefined();
      expect(typeof guard.authorizer.authorize).toBe('function');
    });
  });

  describe('canActivate - SMART-on-FHIR Enabled', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(true);
    });

    it('should return true when authorization is allowed', () => {
      const mockDecision: AccessDecision = {
        allowed: true,
        reasons: ['Granted by scope: patient/*.read']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(true);
    });

    it('should return false when authorization is denied', () => {
      const mockDecision: AccessDecision = {
        allowed: false,
        reasons: ['No scope grants read permission for Patient'],
        warnings: ['Insufficient permissions']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(false);
    });

    it('should handle complex authorization decisions with warnings', () => {
      const mockDecision: AccessDecision = {
        allowed: true,
        reasons: ['Granted by scope: user/*.read'],
        warnings: ['Limited scope access'],
        filteredIncludes: ['Patient.managingOrganization']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(mockRequest);
    });

    it('should pass the correct request object to authorization', () => {
      const customRequest = {
        method: 'POST',
        url: '/fhir/Observation',
        headers: {
          authorization: 'Bearer custom.jwt.token',
          'content-type': 'application/fhir+json'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(customRequest);

      const mockDecision: AccessDecision = { allowed: true };
      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      guard.canActivate(mockExecutionContext);

      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(customRequest);
    });

    it('should handle authorization with different HTTP methods', () => {
      const testCases = [
        { method: 'GET', expectedAllowed: true },
        { method: 'POST', expectedAllowed: false },
        { method: 'PUT', expectedAllowed: true },
        { method: 'DELETE', expectedAllowed: false }
      ];

      testCases.forEach(({ method, expectedAllowed }) => {
        const request = { ...mockRequest, method };
        (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

        const mockDecision: AccessDecision = { allowed: expectedAllowed };
        mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(expectedAllowed);
        expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(request);

        jest.clearAllMocks();
        mockConfigService.get.mockReturnValue(true); // Reset config mock
      });
    });

    it('should handle authorization with missing headers', () => {
      const requestWithoutAuth = {
        method: 'GET',
        url: '/fhir/Patient',
        headers: {}
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(requestWithoutAuth);

      const mockDecision: AccessDecision = {
        allowed: false,
        reasons: ['No authorization header provided']
      };
      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(requestWithoutAuth);
    });
  });

  describe('canActivate - SMART-on-FHIR Disabled', () => {
    it('should return true when SMART-on-FHIR is explicitly disabled', () => {
      mockConfigService.get.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true when SMART-on-FHIR config is undefined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true when SMART-on-FHIR config is null', () => {
      mockConfigService.get.mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true for non-boolean truthy values', () => {
      const truthyValues = ['true', 1, {}, []];

      truthyValues.forEach(value => {
        mockConfigService.get.mockReturnValue(value);

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();

        jest.clearAllMocks();
      });
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle strict boolean comparison for enabled state', () => {
      const testCases = [
        { configValue: true, expectedAuthCalled: true, expectedResult: true },
        { configValue: false, expectedAuthCalled: false, expectedResult: true },
        { configValue: 'true', expectedAuthCalled: false, expectedResult: true },
        { configValue: 1, expectedAuthCalled: false, expectedResult: true },
        { configValue: 0, expectedAuthCalled: false, expectedResult: true }
      ];

      testCases.forEach(({ configValue, expectedAuthCalled, expectedResult }) => {
        mockConfigService.get.mockReturnValue(configValue);

        if (expectedAuthCalled) {
          const mockDecision: AccessDecision = { allowed: expectedResult };
          mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);
        }

        const result = guard.canActivate(mockExecutionContext);

        expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
        
        if (expectedAuthCalled) {
          expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(mockRequest);
        } else {
          expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
        }
        
        expect(result).toBe(expectedResult);

        jest.clearAllMocks();
      });
    });

    it('should handle config service errors gracefully', () => {
      mockConfigService.get.mockImplementation(() => {
        throw new Error('Configuration service unavailable');
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Configuration service unavailable');
      expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
    });
  });

  describe('Request Context Handling', () => {
    it('should handle different execution contexts', () => {
      const mockDecision: AccessDecision = { allowed: true };
      mockConfigService.get.mockReturnValue(true);
      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      // Test with different mock requests
      const customRequest = {
        method: 'PATCH',
        url: '/fhir/Patient/123',
        headers: {
          authorization: 'Bearer different.token'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(customRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockExecutionContext.switchToHttp().getRequest).toHaveBeenCalled();
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(customRequest);
      expect(result).toBe(true);
    });

    it('should handle request extraction errors', () => {
      mockConfigService.get.mockReturnValue(true);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to extract request');
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow('Failed to extract request');
    });
  });

  describe('Authorization Decision Variations', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(true);
    });

    it('should handle authorization decision with empty reasons', () => {
      const mockDecision: AccessDecision = {
        allowed: true,
        reasons: []
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle authorization decision with only warnings', () => {
      const mockDecision: AccessDecision = {
        allowed: false,
        warnings: ['Token expired', 'Invalid scope format']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle authorization decision with filtered includes', () => {
      const mockDecision: AccessDecision = {
        allowed: true,
        reasons: ['Partial access granted'],
        filteredIncludes: ['Patient.managingOrganization', 'Patient.generalPractitioner']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle minimal authorization decision', () => {
      const mockDecision: AccessDecision = {
        allowed: true
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical allowed request scenario', () => {
      mockConfigService.get.mockReturnValue(true);

      const typicalRequest = {
        method: 'GET',
        url: '/fhir/Patient?active=true',
        headers: {
          authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9',
          accept: 'application/fhir+json'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(typicalRequest);

      const mockDecision: AccessDecision = {
        allowed: true,
        reasons: ['Granted by scope: user/Patient.read']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(typicalRequest);
    });

    it('should work correctly in a typical denied request scenario', () => {
      mockConfigService.get.mockReturnValue(true);

      const unauthorizedRequest = {
        method: 'DELETE',
        url: '/fhir/Patient/123',
        headers: {
          authorization: 'Bearer limited.scope.token'
        }
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(unauthorizedRequest);

      const mockDecision: AccessDecision = {
        allowed: false,
        reasons: ['No scope grants delete permission for Patient'],
        warnings: ['Attempted unauthorized operation']
      };

      mockFhirScopeAuthorization.authorize.mockReturnValue(mockDecision);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).toHaveBeenCalledWith(unauthorizedRequest);
    });

    it('should bypass authorization in development environment', () => {
      // Simulate development environment where SMART-on-FHIR is disabled
      mockConfigService.get.mockReturnValue(false);

      const devRequest = {
        method: 'POST',
        url: '/fhir/Patient',
        headers: {}
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(devRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('authorization.smartOnFhir.enabled');
      expect(mockFhirScopeAuthorization.authorize).not.toHaveBeenCalled();
    });
  });
});