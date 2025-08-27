import {Test, TestingModule} from '@nestjs/testing';
import {FhirController} from './fhir.controller';
import {FhirService} from '../services/fhir/fhir.service';
import {ValidationService} from '../services/validation/validation.service';
import {CreateResourceDto} from '../dto/create-resource-dto';
import {UpdateResourceDto} from '../dto/update-resource-dto';
import {ValidateResourceDto} from '../dto/validate-resource-dto';
import {SearchResult} from '../interfaces/search-result';
import {SearchParameters} from '../interfaces/search-parameters';
import {ValidationResult} from '../interfaces/validation-result';

// Mock the guards to avoid jose import issues
jest.mock('../guards/authorizer/authorizer.guard', () => ({
  AuthorizerGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn(() => true)
  }))
}));

jest.mock('../guards/fhir-authorizer/fhir-authorizer.guard', () => ({
  FhirAuthorizerGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn(() => true)
  }))
}));

describe('FhirController', () => {
  let controller: FhirController;
  let mockFhirService: jest.Mocked<FhirService>;
  let mockValidationService: jest.Mocked<ValidationService>;

  // Mock data
  const mockSearchResult: SearchResult = {
    resourceType: 'Bundle',
    id: 'search-bundle-1',
    type: 'searchset',
    total: 2,
    entry: [
      {
        fullUrl: 'http://example.com/fhir/Patient/patient-1',
        resource: {
          resourceType: 'Patient',
          id: 'patient-1',
          name: [{ family: 'Doe', given: ['John'] }]
        }
      },
      {
        fullUrl: 'http://example.com/fhir/Patient/patient-2',
        resource: {
          resourceType: 'Patient',
          id: 'patient-2',
          name: [{ family: 'Smith', given: ['Jane'] }]
        }
      }
    ]
  };

  const mockPatient = {
    resourceType: 'Patient',
    id: 'patient-123',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
    },
    name: [
      {
        use: 'official',
        family: 'Doe',
        given: ['John']
      }
    ],
    gender: 'male',
    birthDate: '1990-01-01'
  };

  const mockCapabilityStatement = {
    resourceType: 'CapabilityStatement',
    id: 'fhir-server',
    name: 'FHIR Server',
    status: 'active',
    date: '2023-08-27',
    kind: 'instance',
    software: {
      name: 'FHIR Server',
      version: '0.2.1'
    },
    implementation: {
      description: 'FHIR R4 Server Implementation'
    },
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        {
          type: 'Patient',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
            { code: 'delete' }
          ]
        }
      ]
    }]
  };

  const mockValidationResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  beforeEach(async () => {
    const mockFhirServiceProvider = {
      findByType: jest.fn(),
      getMetaData: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      checkPreRequest: jest.fn()
    };

    const mockValidationServiceProvider = {
      validateResource: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FhirController],
      providers: [
        {
          provide: FhirService,
          useValue: mockFhirServiceProvider
        },
        {
          provide: ValidationService,
          useValue: mockValidationServiceProvider
        }
      ]
    }).compile();

    controller = module.get<FhirController>(FhirController);
    mockFhirService = module.get(FhirService);
    mockValidationService = module.get(ValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have FhirService injected', () => {
      expect(mockFhirService).toBeDefined();
    });

    it('should have ValidationService injected', () => {
      expect(mockValidationService).toBeDefined();
    });
  });

  describe('findByType', () => {
    it('should search resources by type with no search parameters', async () => {
      const searchParams: SearchParameters = {};
      mockFhirService.findByType.mockResolvedValue(mockSearchResult);

      const result = await controller.findByType(searchParams);

      expect(mockFhirService.findByType).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(mockSearchResult);
    });

    it('should search resources by type with search parameters', async () => {
      const searchParams: SearchParameters = {
        _count: 10,
        _offset: 0,
        _sort: 'name',
        _type: 'Patient'
      };
      mockFhirService.findByType.mockResolvedValue(mockSearchResult);

      const result = await controller.findByType(searchParams);

      expect(mockFhirService.findByType).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(mockSearchResult);
    });

    it('should handle empty search results', async () => {
      const emptyResult: SearchResult = {
        resourceType: 'Bundle',
        id: 'empty-bundle',
        type: 'searchset',
        total: 0,
        entry: []
      };
      const searchParams: SearchParameters = { _type: 'NonExistentResource' };
      mockFhirService.findByType.mockResolvedValue(emptyResult);

      const result = await controller.findByType(searchParams);

      expect(mockFhirService.findByType).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(emptyResult);
      expect(result.total).toBe(0);
    });

    it('should handle service errors', async () => {
      const searchParams: SearchParameters = {};
      const error = new Error('Database connection failed');
      mockFhirService.findByType.mockRejectedValue(error);

      await expect(controller.findByType(searchParams)).rejects.toThrow('Database connection failed');
      expect(mockFhirService.findByType).toHaveBeenCalledWith(searchParams);
    });
  });

  describe('getCapabilityStatement', () => {
    it('should return server capability statement', async () => {
      mockFhirService.getMetaData.mockResolvedValue(mockCapabilityStatement);

      const result = await controller.getCapabilityStatement();

      expect(mockFhirService.getMetaData).toHaveBeenCalled();
      expect(result).toEqual(mockCapabilityStatement);
      expect(result.resourceType).toBe('CapabilityStatement');
    });

    it('should return capability statement with correct structure', async () => {
      mockFhirService.getMetaData.mockResolvedValue(mockCapabilityStatement);

      const result = await controller.getCapabilityStatement();

      expect(result).toHaveProperty('resourceType', 'CapabilityStatement');
      expect(result).toHaveProperty('fhirVersion');
      expect(result).toHaveProperty('rest');
      expect(Array.isArray(result.rest)).toBe(true);
    });

    it('should handle service returning null/undefined', async () => {
      mockFhirService.getMetaData.mockResolvedValue(null);

      const result = await controller.getCapabilityStatement();

      expect(result).toBeNull();
      expect(mockFhirService.getMetaData).toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should validate a valid FHIR resource', async () => {
      const resource: ValidateResourceDto = mockPatient as ValidateResourceDto;
      mockValidationService.validateResource.mockResolvedValue(mockValidationResult);

      const result = await controller.validate(resource);

      expect(mockValidationService.validateResource).toHaveBeenCalledWith(resource);
      expect(result).toEqual(mockValidationResult);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid resource', async () => {
      const invalidResource: ValidateResourceDto = {
        resourceType: 'Patient',
        // Missing required fields
      } as ValidateResourceDto;

      const invalidResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            path: 'Patient.name',
            severity: 'error',
            message: 'Missing required field: name'
          }
        ],
        warnings: []
      };

      mockValidationService.validateResource.mockResolvedValue(invalidResult);

      const result = await controller.validate(invalidResource);

      expect(mockValidationService.validateResource).toHaveBeenCalledWith(invalidResource);
      expect(result).toEqual(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should return validation warnings', async () => {
      const resource: ValidateResourceDto = mockPatient as ValidateResourceDto;
      const resultWithWarnings: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            path: 'Patient.telecom',
            message: 'Recommended field missing: telecom'
          }
        ]
      };

      mockValidationService.validateResource.mockResolvedValue(resultWithWarnings);

      const result = await controller.validate(resource);

      expect(mockValidationService.validateResource).toHaveBeenCalledWith(resource);
      expect(result).toEqual(resultWithWarnings);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle validation service errors', async () => {
      const resource: ValidateResourceDto = mockPatient as ValidateResourceDto;
      const error = new Error('Validation service unavailable');
      mockValidationService.validateResource.mockRejectedValue(error);

      await expect(controller.validate(resource)).rejects.toThrow('Validation service unavailable');
      expect(mockValidationService.validateResource).toHaveBeenCalledWith(resource);
    });
  });

  describe('searchResources', () => {
    it('should search resources by resource type', async () => {
      const resourceType = 'Patient';
      const searchParams: SearchParameters = { _count: 10 };
      mockFhirService.find.mockResolvedValue(mockSearchResult);

      const result = await controller.searchResources(resourceType, searchParams);

      expect(mockFhirService.find).toHaveBeenCalledWith(resourceType, searchParams);
      expect(result).toEqual(mockSearchResult);
    });

    it('should search resources without search parameters', async () => {
      const resourceType = 'Patient';
      mockFhirService.find.mockResolvedValue(mockSearchResult);

      const result = await controller.searchResources(resourceType);

      expect(mockFhirService.find).toHaveBeenCalledWith(resourceType, {});
      expect(result).toEqual(mockSearchResult);
    });

    it('should handle different resource types', async () => {
      const resourceTypes = ['Patient', 'Observation', 'Practitioner', 'Organization'];
      
      for (const resourceType of resourceTypes) {
        const specificResult = { ...mockSearchResult, type: resourceType };
        mockFhirService.find.mockResolvedValue(specificResult);

        const result = await controller.searchResources(resourceType, {});

        expect(mockFhirService.find).toHaveBeenCalledWith(resourceType, {});
        expect(result).toEqual(specificResult);
      }
    });

    it('should handle search with complex parameters', async () => {
      const resourceType = 'Patient';
      const complexSearchParams: SearchParameters = {
        _id: 'patient-123',
        _count: 50,
        _offset: 10,
        _sort: 'family',
        _include: ['Patient:organization'],
        _profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
        identifier: 'http://example.com/fhir/NamingSystem/ssn|123456789'
      };

      mockFhirService.find.mockResolvedValue(mockSearchResult);

      const result = await controller.searchResources(resourceType, complexSearchParams);

      expect(mockFhirService.find).toHaveBeenCalledWith(resourceType, complexSearchParams);
      expect(result).toEqual(mockSearchResult);
    });

    it('should handle service errors during search', async () => {
      const resourceType = 'Patient';
      const error = new Error('Search failed');
      mockFhirService.find.mockRejectedValue(error);

      await expect(controller.searchResources(resourceType, {})).rejects.toThrow('Search failed');
      expect(mockFhirService.find).toHaveBeenCalledWith(resourceType, {});
    });
  });

  describe('getResource', () => {
    it('should get resource by ID', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      mockFhirService.findById.mockResolvedValue(mockPatient);

      const result = await controller.getResource(resourceType, id);

      expect(mockFhirService.findById).toHaveBeenCalledWith(resourceType, id, undefined);
      expect(result).toEqual(mockPatient);
    });

    it('should get resource by ID with search parameters', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const searchParams: SearchParameters = { _summary: 'true' };
      mockFhirService.findById.mockResolvedValue(mockPatient);

      const result = await controller.getResource(resourceType, id, searchParams);

      expect(mockFhirService.findById).toHaveBeenCalledWith(resourceType, id, searchParams);
      expect(result).toEqual(mockPatient);
    });

    it('should handle resource not found', async () => {
      const resourceType = 'Patient';
      const id = 'non-existent-id';
      const error = new Error('Resource not found');
      mockFhirService.findById.mockRejectedValue(error);

      await expect(controller.getResource(resourceType, id)).rejects.toThrow('Resource not found');
      expect(mockFhirService.findById).toHaveBeenCalledWith(resourceType, id, undefined);
    });

    it('should handle different resource types', async () => {
      const resourceTypes = ['Patient', 'Observation', 'Practitioner'];
      
      for (const resourceType of resourceTypes) {
        const id = `${resourceType.toLowerCase()}-123`;
        const mockResource = { ...mockPatient, resourceType, id };
        mockFhirService.findById.mockResolvedValue(mockResource);

        const result = await controller.getResource(resourceType, id);

        expect(mockFhirService.findById).toHaveBeenCalledWith(resourceType, id, undefined);
        expect(result.resourceType).toBe(resourceType);
        expect(result.id).toBe(id);
      }
    });
  });

  describe('createResource', () => {
    it('should create a new resource', async () => {
      const resourceType = 'Patient';
      const resource: CreateResourceDto = {
        resourceType: 'Patient',
        name: [{ family: 'Doe', given: ['John'] }],
        gender: 'male'
      };
      
      const createdResource = { ...resource, id: 'patient-new-123' };
      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      mockFhirService.create.mockResolvedValue(createdResource);

      const result = await controller.createResource(resourceType, resource);

      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource);
      expect(mockFhirService.create).toHaveBeenCalledWith(resourceType, resource);
      expect(result).toEqual(createdResource);
      expect(result.id).toBeDefined();
    });

    it('should create resource with provided ID', async () => {
      const resourceType = 'Patient';
      const resource: CreateResourceDto = {
        resourceType: 'Patient',
        id: 'custom-patient-id',
        name: [{ family: 'Smith', given: ['Jane'] }],
        gender: 'female'
      };

      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      mockFhirService.create.mockResolvedValue(resource);

      const result = await controller.createResource(resourceType, resource);

      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource);
      expect(mockFhirService.create).toHaveBeenCalledWith(resourceType, resource);
      expect(result).toEqual(resource);
      expect(result.id).toBe('custom-patient-id');
    });

    it('should handle pre-request validation failure', async () => {
      const resourceType = 'Patient';
      const resource: CreateResourceDto = {
        resourceType: 'Patient',
        name: [{ family: 'Invalid' }]
      };

      const error = new Error('Pre-request validation failed');
      mockFhirService.checkPreRequest.mockRejectedValue(error);

      await expect(controller.createResource(resourceType, resource)).rejects.toThrow('Pre-request validation failed');
      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource);
      expect(mockFhirService.create).not.toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const resourceType = 'Patient';
      const resource: CreateResourceDto = {
        resourceType: 'Patient',
        name: [{ family: 'Doe', given: ['John'] }]
      };

      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      const error = new Error('Database error during creation');
      mockFhirService.create.mockRejectedValue(error);

      await expect(controller.createResource(resourceType, resource)).rejects.toThrow('Database error during creation');
      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource);
      expect(mockFhirService.create).toHaveBeenCalledWith(resourceType, resource);
    });

    it('should create different resource types', async () => {
      const testCases = [
        { resourceType: 'Patient', resource: { resourceType: 'Patient', name: [{ family: 'Test' }] } },
        { resourceType: 'Observation', resource: { resourceType: 'Observation', status: 'final', code: { text: 'Test' } } },
        { resourceType: 'Practitioner', resource: { resourceType: 'Practitioner', name: [{ family: 'Doctor' }] } }
      ];

      for (const testCase of testCases) {
        const createdResource = { ...testCase.resource, id: `${testCase.resourceType.toLowerCase()}-123` };
        mockFhirService.checkPreRequest.mockResolvedValue(undefined);
        mockFhirService.create.mockResolvedValue(createdResource);

        const result = await controller.createResource(testCase.resourceType, testCase.resource);

        expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', testCase.resourceType, testCase.resource);
        expect(mockFhirService.create).toHaveBeenCalledWith(testCase.resourceType, testCase.resource);
        expect(result.resourceType).toBe(testCase.resourceType);
      }
    });
  });

  describe('update', () => {
    it('should update an existing resource', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const resource: UpdateResourceDto = {
        resourceType: 'Patient',
        id: 'patient-123',
        name: [{ family: 'Updated', given: ['John'] }],
        gender: 'male'
      };

      const updatedResource = { ...resource, meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Patient'] } };
      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      mockFhirService.update.mockResolvedValue(updatedResource);

      const result = await controller.update(resourceType, id, resource);

      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource, id);
      expect(mockFhirService.update).toHaveBeenCalledWith(resourceType, id, resource);
      expect(result).toEqual(updatedResource);
    });

    it('should handle pre-request validation failure on update', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const resource: UpdateResourceDto = {
        resourceType: 'Patient',
        id: 'mismatched-id'
      };

      const error = new Error('ID mismatch');
      mockFhirService.checkPreRequest.mockRejectedValue(error);

      await expect(controller.update(resourceType, id, resource)).rejects.toThrow('ID mismatch');
      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource, id);
      expect(mockFhirService.update).not.toHaveBeenCalled();
    });

    it('should handle update of non-existent resource', async () => {
      const resourceType = 'Patient';
      const id = 'non-existent-id';
      const resource: UpdateResourceDto = {
        resourceType: 'Patient',
        id: 'non-existent-id'
      };

      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      const error = new Error('Resource not found');
      mockFhirService.update.mockRejectedValue(error);

      await expect(controller.update(resourceType, id, resource)).rejects.toThrow('Resource not found');
      expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', resourceType, resource, id);
      expect(mockFhirService.update).toHaveBeenCalledWith(resourceType, id, resource);
    });

    it('should update different resource types', async () => {
      const testCases = [
        { resourceType: 'Patient', id: 'patient-123', resource: { resourceType: 'Patient', name: [{ family: 'Updated' }] } },
        { resourceType: 'Observation', id: 'obs-123', resource: { resourceType: 'Observation', status: 'amended' } }
      ];

      for (const testCase of testCases) {
        const updatedResource = { ...testCase.resource, id: testCase.id, meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Patient'] } };
        mockFhirService.checkPreRequest.mockResolvedValue(undefined);
        mockFhirService.update.mockResolvedValue(updatedResource);

        const result = await controller.update(testCase.resourceType, testCase.id, testCase.resource);

        expect(mockFhirService.checkPreRequest).toHaveBeenCalledWith('POST', testCase.resourceType, testCase.resource, testCase.id);
        expect(mockFhirService.update).toHaveBeenCalledWith(testCase.resourceType, testCase.id, testCase.resource);
        expect(result.resourceType).toBe(testCase.resourceType);
        expect(result.id).toBe(testCase.id);
      }
    });

    it('should handle concurrent modification conflicts', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const resource: UpdateResourceDto = {
        resourceType: 'Patient',
        id: 'patient-123',
        meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Patient'] }
      };

      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      const error = new Error('Version conflict: resource modified by another process');
      mockFhirService.update.mockRejectedValue(error);

      await expect(controller.update(resourceType, id, resource)).rejects.toThrow('Version conflict');
      expect(mockFhirService.update).toHaveBeenCalledWith(resourceType, id, resource);
    });
  });

  describe('delete', () => {
    it('should delete a resource', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const deleteResult = { resourceType: 'OperationOutcome', id: 'deleted' };
      mockFhirService.delete.mockResolvedValue(deleteResult);

      const result = await controller.delete(resourceType, id);

      expect(mockFhirService.delete).toHaveBeenCalledWith(resourceType, id);
      expect(result).toEqual(deleteResult);
    });

    it('should handle deletion of non-existent resource', async () => {
      const resourceType = 'Patient';
      const id = 'non-existent-id';
      const error = new Error('Resource not found');
      mockFhirService.delete.mockRejectedValue(error);

      await expect(controller.delete(resourceType, id)).rejects.toThrow('Resource not found');
      expect(mockFhirService.delete).toHaveBeenCalledWith(resourceType, id);
    });

    it('should delete different resource types', async () => {
      const testCases = [
        { resourceType: 'Patient', id: 'patient-123' },
        { resourceType: 'Observation', id: 'obs-123' },
        { resourceType: 'Practitioner', id: 'pract-123' }
      ];

      for (const testCase of testCases) {
        const deleteResult = { resourceType: 'OperationOutcome', id: `deleted-${testCase.id}` };
        mockFhirService.delete.mockResolvedValue(deleteResult);

        const result = await controller.delete(testCase.resourceType, testCase.id);

        expect(mockFhirService.delete).toHaveBeenCalledWith(testCase.resourceType, testCase.id);
        expect(result).toEqual(deleteResult);
      }
    });

    it('should handle database errors during deletion', async () => {
      const resourceType = 'Patient';
      const id = 'patient-123';
      const error = new Error('Database connection lost');
      mockFhirService.delete.mockRejectedValue(error);

      await expect(controller.delete(resourceType, id)).rejects.toThrow('Database connection lost');
      expect(mockFhirService.delete).toHaveBeenCalledWith(resourceType, id);
    });

    it('should handle referential integrity constraints', async () => {
      const resourceType = 'Organization';
      const id = 'org-123';
      const error = new Error('Cannot delete resource: referenced by other resources');
      mockFhirService.delete.mockRejectedValue(error);

      await expect(controller.delete(resourceType, id)).rejects.toThrow('Cannot delete resource: referenced by other resources');
      expect(mockFhirService.delete).toHaveBeenCalledWith(resourceType, id);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      // Test with null search parameters
      mockFhirService.findByType.mockResolvedValue(mockSearchResult);
      await controller.findByType(null as any);
      expect(mockFhirService.findByType).toHaveBeenCalledWith(null);

      // Test with undefined resource type
      mockFhirService.find.mockResolvedValue(mockSearchResult);
      await controller.searchResources(undefined as any);
      expect(mockFhirService.find).toHaveBeenCalledWith(undefined, {});
    });

    it('should handle empty string parameters', async () => {
      mockFhirService.findById.mockRejectedValue(new Error('Invalid resource type'));
      
      await expect(controller.getResource('', 'some-id')).rejects.toThrow('Invalid resource type');
      expect(mockFhirService.findById).toHaveBeenCalledWith('', 'some-id', undefined);
    });

    it('should handle very large search results', async () => {
      const largeResult: SearchResult = {
        resourceType: 'Bundle',
        id: 'large-bundle',
        type: 'searchset',
        total: 10000,
        entry: new Array(1000).fill(null).map((_, index) => ({
          fullUrl: `http://example.com/fhir/Patient/patient-${index}`,
          resource: {
            resourceType: 'Patient',
            id: `patient-${index}`,
            name: [{ family: `TestFamily${index}` }]
          }
        }))
      };

      mockFhirService.findByType.mockResolvedValue(largeResult);
      const result = await controller.findByType({ _count: 1000 });
      
      expect(result.total).toBe(10000);
      expect(result.entry).toHaveLength(1000);
    });

    it('should handle network timeout scenarios', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockFhirService.find.mockRejectedValue(timeoutError);
      
      await expect(controller.searchResources('Patient', {})).rejects.toThrow('Request timeout');
    });

    it('should handle malformed resource data', async () => {
      const malformedResource: CreateResourceDto = {
        resourceType: 'Patient',
        invalidField: 'this should not be here',
        // Missing required fields
      } as any;

      mockFhirService.checkPreRequest.mockRejectedValue(new Error('Invalid resource structure'));

      await expect(controller.createResource('Patient', malformedResource)).rejects.toThrow('Invalid resource structure');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      const resourceType = 'Patient';
      const createDto: CreateResourceDto = {
        resourceType: 'Patient',
        name: [{ family: 'TestCRUD', given: ['Integration'] }],
        gender: 'male'
      };

      // Create
      const createdResource = { ...createDto, id: 'integration-123' };
      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      mockFhirService.create.mockResolvedValue(createdResource);

      const created = await controller.createResource(resourceType, createDto);
      expect(created.id).toBe('integration-123');

      // Read
      mockFhirService.findById.mockResolvedValue(createdResource);
      const retrieved = await controller.getResource(resourceType, 'integration-123');
      expect(retrieved).toEqual(createdResource);

      // Update
      const updateDto: UpdateResourceDto = { ...createdResource, gender: 'female' };
      const updatedResource = { ...updateDto, meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Patient'] } };
      mockFhirService.update.mockResolvedValue(updatedResource);

      const updated = await controller.update(resourceType, 'integration-123', updateDto);
      expect(updated.gender).toBe('female');

      // Delete
      const deleteResult = { resourceType: 'OperationOutcome', id: 'deleted' };
      mockFhirService.delete.mockResolvedValue(deleteResult);

      const deleted = await controller.delete(resourceType, 'integration-123');
      expect(deleted).toEqual(deleteResult);
    });

    it('should handle validation before creation', async () => {
      const resourceType = 'Patient';
      const resource: CreateResourceDto = {
        resourceType: 'Patient',
        name: [{ family: 'ValidatedPatient' }]
      };

      // First validate
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ path: 'Patient.gender', severity: 'error', message: 'Missing required field' }],
        warnings: []
      };
      mockValidationService.validateResource.mockResolvedValue(validationResult);

      const validation = await controller.validate(resource as ValidateResourceDto);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);

      // Fix the resource and try again
      const fixedResource = { ...resource, gender: 'male' };
      const validResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
      mockValidationService.validateResource.mockResolvedValue(validResult);

      const validValidation = await controller.validate(fixedResource as ValidateResourceDto);
      expect(validValidation.isValid).toBe(true);

      // Now create the valid resource
      const createdResource = { ...fixedResource, id: 'validated-123' };
      mockFhirService.checkPreRequest.mockResolvedValue(undefined);
      mockFhirService.create.mockResolvedValue(createdResource);

      const created = await controller.createResource(resourceType, fixedResource);
      expect(created.id).toBe('validated-123');
    });
  });
});