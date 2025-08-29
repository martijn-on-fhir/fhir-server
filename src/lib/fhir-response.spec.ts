import { FhirResponse } from './fhir-response';
import { FhirResourceDocument } from '../schema/fhir-resource-schema';
import { ValidationResult } from '../interfaces/validation-result';
import { Request } from 'express';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123')
}));

describe('FhirResponse', () => {
  const mockResource: FhirResourceDocument = {
    resourceType: 'Patient',
    id: 'patient-123',
    name: [{ family: 'Doe', given: ['John'] }],
    meta: {
      versionId: '1',
      lastUpdated: new Date('2023-01-01T00:00:00Z')
    }
  } as any;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockRequest = Object.assign(Object.create(require('http').IncomingMessage.prototype), {
    url: '/fhir/Patient?name=Doe&_count=10&_offset=0',
    query: { name: 'Doe', _count: '10', _offset: '0' },
    get: jest.fn().mockImplementation((header: string) => {
      if (header === 'host') return 'localhost:3000';
      if (header === 'secure') return false;
      return null;
    })
  }) as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('format', () => {
    it('should format a FHIR resource by spreading its properties', () => {
      const result = FhirResponse.format(mockResource);

      expect(result).toEqual({
        resourceType: 'Patient',
        id: 'patient-123',
        name: [{ family: 'Doe', given: ['John'] }],
        meta: {
          versionId: '1',
          lastUpdated: new Date('2023-01-01T00:00:00Z')
        }
      });
    });

    it('should handle empty resource', () => {
      const emptyResource = {} as FhirResourceDocument;
      const result = FhirResponse.format(emptyResource);

      expect(result).toEqual({});
    });
  });

  describe('forbidden', () => {
    it('should create OperationOutcome for forbidden error', () => {
      const description = 'Access denied to this resource';
      const result = FhirResponse.forbidden(description);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: description }
        }]
      });
    });
  });

  describe('badRequest', () => {
    it('should create OperationOutcome for bad request error', () => {
      const description = 'Invalid request parameters';
      const result = FhirResponse.badRequest(description);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'bad request',
          details: { text: description }
        }]
      });
    });
  });

  describe('notValid', () => {
    it('should create OperationOutcome for validation errors', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            path: 'Patient.name',
            severity: 'error' as const,
            message: 'Missing required field: name',
            constraint: 'required'
          },
          {
            path: 'Patient.birthDate',
            severity: 'error' as const,
            message: 'Invalid date format',
            constraint: 'date-format'
          }
        ] as any,
        warnings: []
      };

      const result = FhirResponse.notValid(validationResult);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            details: {
              text: {
                path: 'Patient.name',
                severity: 'error',
                message: 'Missing required field: name',
                constraint: 'required'
              }
            }
          },
          {
            severity: 'error',
            code: 'invalid',
            details: {
              text: {
                path: 'Patient.birthDate',
                severity: 'error',
                message: 'Invalid date format',
                constraint: 'date-format'
              }
            }
          }
        ]
      });
    });

    it('should handle empty validation errors', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [],
        warnings: []
      };

      const result = FhirResponse.notValid(validationResult);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: []
      });
    });
  });

  describe('notFound', () => {
    it('should create OperationOutcome for not found error', () => {
      const description = 'Patient/123 not found';
      const result = FhirResponse.notFound(description);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: description }
        }]
      });
    });
  });

  describe('notAcceptable', () => {
    it('should create OperationOutcome for not acceptable error', () => {
      const description = 'Content type not supported';
      const result = FhirResponse.notAcceptable(description);

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-acceptable',
          details: { text: description }
        }]
      });
    });
  });

  describe('bundle', () => {
    const mockResources: FhirResourceDocument[] = [
      {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ family: 'Doe', given: ['John'] }]
      },
      {
        resourceType: 'Patient',
        id: 'patient-2',
        name: [{ family: 'Smith', given: ['Jane'] }]
      }
    ] as any[];

    it('should create a FHIR Bundle with resources and pagination', () => {
      const total = 100;
      const offset = 0;
      const count = 20;

      const result = FhirResponse.bundle(mockResources, total, offset, count, mockRequest);

      expect(result).toEqual({
        resourceType: 'Bundle',
        id: 'mocked-uuid-123',
        type: 'searchset',
        total: 100,
        link: [
          {
            relation: 'self',
            url: 'http://localhost:3000/fhir/Patient?name=Doe&_offset=0&_count=20'
          },
          {
            relation: 'next',
            url: 'http://localhost:3000/fhir/Patient?name=Doe&_offset=20&_count=20'
          }
        ],
        entry: [
          {
            fullUrl: 'http://localhost:3000/fhir/Patient/patient-1',
            resource: mockResources[0],
            search: { mode: 'match' }
          },
          {
            fullUrl: 'http://localhost:3000/fhir/Patient/patient-2',
            resource: mockResources[1],
            search: { mode: 'match' }
          }
        ]
      });
    });

    it('should handle pagination with previous link', () => {
      const total = 100;
      const offset = 40;
      const count = 20;

      const result = FhirResponse.bundle(mockResources, total, offset, count, mockRequest);

      expect(result.link).toContainEqual({
        relation: 'previous',
        url: 'http://localhost:3000/fhir/Patient?name=Doe&_offset=20&_count=20'
      });
    });

    it('should not include next link when at end of results', () => {
      const total = 10;
      const offset = 0;
      const count = 20;

      const result = FhirResponse.bundle(mockResources, total, offset, count, mockRequest);

      const nextLink = result.link.find((link: any) => link.relation === 'next');
      expect(nextLink).toBeUndefined();
    });

    it('should not include previous link when at beginning', () => {
      const total = 100;
      const offset = 0;
      const count = 20;

      const result = FhirResponse.bundle(mockResources, total, offset, count, mockRequest);

      const previousLink = result.link.find((link: any) => link.relation === 'previous');
      expect(previousLink).toBeUndefined();
    });

    it('should handle empty resources array', () => {
      const result = FhirResponse.bundle([], 0, 0, 20, mockRequest);

      expect(result.entry).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should work without request object', () => {
      const result = FhirResponse.bundle(mockResources, 10, 0, 20);

      expect(result.resourceType).toBe('Bundle');
      expect(result.entry).toHaveLength(2);
      expect(result.link[0].url).not.toContain('http');
    });

    it('should handle URL without query parameters', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockRequestNoQuery = Object.assign(Object.create(require('http').IncomingMessage.prototype), {
        url: '/fhir/Patient',
        query: null,
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'host') return 'localhost:3000';
          if (header === 'secure') return false;
          return null;
        })
      }) as unknown as Request;

      const result = FhirResponse.bundle(mockResources, 10, 0, 20, mockRequestNoQuery);

      expect(result.link[0].url).toBe('http://localhost:3000/fhir/Patient?_offset=0&_count=20');
    });

    it('should use default pagination values', () => {
      const result = FhirResponse.bundle(mockResources, 100, undefined, undefined, mockRequest);

      expect(result.link[0].url).toContain('_offset=0&_count=20');
    });

    it('should handle secure connections', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      const secureRequest = Object.assign(Object.create(require('http').IncomingMessage.prototype), {
        url: '/fhir/Patient?name=Doe&_count=10&_offset=0',
        query: { name: 'Doe', _count: '10', _offset: '0' },
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'host') return 'localhost:3000';
          if (header === 'secure') return true;
          return null;
        })
      }) as unknown as Request;

      const result = FhirResponse.bundle(mockResources, 10, 0, 20, secureRequest);

      expect(result.entry[0].fullUrl).toContain('https://localhost:3000');
    });
  });

  describe('concat', () => {
    const mockCollection = [
      {
        resourceType: 'Observation',
        id: 'obs-1',
        subject: { reference: 'Patient/patient-123' }
      },
      {
        resourceType: 'Condition',
        id: 'cond-1',
        subject: { reference: 'Patient/patient-123' }
      }
    ];

    it('should create a Bundle with main resource and included resources', () => {
      const result = FhirResponse.concat(mockResource, mockCollection, mockRequest);

      expect(result).toEqual({
        id: 'mocked-uuid-123',
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            fullUrl: 'http://localhost:3000/fhir/Patient/patient-123',
            resource: mockResource,
            search: {
              mode: 'match',
              score: 1
            }
          },
          {
            fullUrl: 'http://localhost:3000/fhir/Observation/patient-123',
            resource: mockResource,
            search: {
              mode: 'include',
              score: 1
            }
          },
          {
            fullUrl: 'http://localhost:3000/fhir/Condition/patient-123',
            resource: mockResource,
            search: {
              mode: 'include',
              score: 1
            }
          }
        ]
      });
    });

    it('should handle empty collection', () => {
      const result = FhirResponse.concat(mockResource, [], mockRequest) as any;

      expect(result.entry).toHaveLength(1);
      expect(result.entry[0].search.mode).toBe('match');
    });

    it('should handle secure connections', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      const secureRequest = Object.assign(Object.create(require('http').IncomingMessage.prototype), {
        url: '/fhir/Patient?name=Doe&_count=10&_offset=0',
        query: { name: 'Doe', _count: '10', _offset: '0' },
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'host') return 'localhost:3000';
          if (header === 'secure') return true;
          return null;
        })
      });

      const result = FhirResponse.concat(mockResource, mockCollection, secureRequest) as any;

      expect(result.entry[0].fullUrl).toContain('https://localhost:3000');
    });

    it('should set total to 1 regardless of collection size', () => {
      const result = FhirResponse.concat(mockResource, mockCollection, mockRequest) as any;

      expect(result.total).toBe(1);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null resource in format', () => {
      const result = FhirResponse.format(null as any);
      expect(result).toEqual({});
    });

    it('should handle undefined resource in format', () => {
      const result = FhirResponse.format(undefined as any);
      expect(result).toEqual({});
    });

    it('should handle special characters in descriptions', () => {
      const description = 'Error with "quotes" and <html> tags & symbols';
      const result = FhirResponse.notFound(description) as any;

      expect(result.issue[0].details.text).toBe(description);
    });

    it('should handle very large validation error arrays', () => {
      const errors = Array(1000).fill({
        path: 'Patient.field',
        severity: 'error' as const,
        message: 'Validation error'
      });
      const validationResult: ValidationResult = {
        isValid: false,
        errors,
        warnings: []
      };

      const result = FhirResponse.notValid(validationResult) as any;

      expect(result.issue).toHaveLength(1000);
      expect(result.issue[0].details.text).toEqual({
        path: 'Patient.field',
        severity: 'error',
        message: 'Validation error'
      });
    });
  });
});