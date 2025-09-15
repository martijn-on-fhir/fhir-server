import { Test, TestingModule } from '@nestjs/testing';
import { FhirService } from './fhir.service';
import { getModelToken } from '@nestjs/mongoose';
import { FhirResource } from '../../schema/fhir-resource-schema';
import { StructureDefinitionSchema } from '../../schema/structure-definition.schema';
import { ValidationService } from '../validation/validation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { FhirEvent } from '../../events/fhir-event-listener';
import { ResourceEvent } from '../../events/subscription-event-listener';

// Mock the operation classes
jest.mock('../../lib/operations/search-operation');
jest.mock('../../lib/operations/create-operation');
jest.mock('../../lib/operations/update-operation');
jest.mock('../../lib/operations/delete-operation');
jest.mock('../../lib/metadata');
jest.mock('../../lib/fhir-response');

import { SearchOperation } from '../../lib/operations/search-operation';
import { CreateOperation } from '../../lib/operations/create-operation';
import { UpdateOperation } from '../../lib/operations/update-operation';
import { DeleteOperation } from '../../lib/operations/delete-operation';
import { Metadata } from '../../lib/metadata';
import { FhirResponse } from '../../lib/fhir-response';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MockSearchOperation = SearchOperation as jest.MockedClass<typeof SearchOperation>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const MockCreateOperation = CreateOperation as jest.MockedClass<typeof CreateOperation>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const MockUpdateOperation = UpdateOperation as jest.MockedClass<typeof UpdateOperation>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const MockDeleteOperation = DeleteOperation as jest.MockedClass<typeof DeleteOperation>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const MockMetadata = Metadata as jest.MockedClass<typeof Metadata>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const MockFhirResponse = FhirResponse as jest.MockedClass<typeof FhirResponse>;

describe('FhirService', () => {
  let service: FhirService;
  let mockFhirResourceModel: any;
  let mockStructureDefinitionModel: any;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockRequest: any;

  beforeEach(async () => {
    mockFhirResourceModel = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockStructureDefinitionModel = {
      distinct: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(['Patient', 'Observation'])
      }),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' },
            { type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' }
          ])
        })
      })
    };

    mockValidationService = {
      validateResource: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      url: '/fhir/Patient/123',
      headers: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FhirService,
        {
          provide: getModelToken(FhirResource.name),
          useValue: mockFhirResourceModel,
        },
        {
          provide: getModelToken(StructureDefinitionSchema.name),
          useValue: mockStructureDefinitionModel,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<FhirService>(FhirService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should find resource by ID successfully', async () => {
      const mockResource = { id: '123', resourceType: 'Patient' };
      const mockSearchOperation = {
        findById: jest.fn().mockResolvedValue(mockResource)
      };
      MockSearchOperation.mockImplementation(() => mockSearchOperation as any);

      const result = await service.findById('Patient', '123');

      expect(result).toEqual(mockResource);
      expect(MockSearchOperation).toHaveBeenCalledWith(mockFhirResourceModel, mockRequest, mockStructureDefinitionModel);
      expect(mockSearchOperation.findById).toHaveBeenCalledWith('Patient', '123', undefined);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(FhirEvent.READ, {
        resourceType: 'Patient',
        id: '123',
        searchParams: undefined,
        request: mockRequest,
      });
    });

    it('should throw NotFoundException when resource not found', async () => {
      const notFoundError = new NotFoundException('Resource not found');
      const mockSearchOperation = {
        findById: jest.fn().mockRejectedValue(notFoundError)
      };
      MockSearchOperation.mockImplementation(() => mockSearchOperation as any);

      await expect(service.findById('Patient', '123')).rejects.toThrow(NotFoundException);
    });

    it('should throw generic error for other failures', async () => {
      const genericError = new Error('Database connection failed');
      const mockSearchOperation = {
        findById: jest.fn().mockRejectedValue(genericError)
      };
      MockSearchOperation.mockImplementation(() => mockSearchOperation as any);

      await expect(service.findById('Patient', '123')).rejects.toThrow('Error retrieving Patient/123: Database connection failed');
    });
  });

  describe('find', () => {
    it('should search resources successfully', async () => {
      const searchParams = { _count: 10, _offset: 0 };
      const mockResult = { entry: [], total: 0 };
      const mockSearchOperation = {
        find: jest.fn().mockResolvedValue(mockResult)
      };
      MockSearchOperation.mockImplementation(() => mockSearchOperation as any);

      const result = await service.find('Patient', searchParams);

      expect(result).toEqual(mockResult);
      expect(mockSearchOperation.find).toHaveBeenCalledWith('Patient', searchParams);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(FhirEvent.SEARCH, {
        resourceType: 'Patient',
        searchParams: searchParams,
        request: mockRequest,
      });
    });
  });

  describe('findByType', () => {
    it('should search by type successfully', async () => {
      const searchParams = { _type: 'Patient,Observation' };
      const mockResult = { entry: [], total: 0 };
      const mockSearchOperation = {
        findByType: jest.fn().mockResolvedValue(mockResult)
      };
      MockSearchOperation.mockImplementation(() => mockSearchOperation as any);

      const result = await service.findByType(searchParams);

      expect(result).toEqual(mockResult);
      expect(mockSearchOperation.findByType).toHaveBeenCalledWith(['Patient', 'Observation'], searchParams);
    });

    it('should return not acceptable when _type is missing', async () => {
      const mockResponse = { status: 406, message: 'Not Acceptable' };
      MockFhirResponse.notAcceptable = jest.fn().mockReturnValue(mockResponse);

      const result = await service.findByType({});

      expect(result).toEqual(mockResponse);
      expect(MockFhirResponse.notAcceptable).toHaveBeenCalledWith('_type is a required parameter when no resource are defined');
    });
  });

  describe('create', () => {
    it('should create resource successfully', async () => {
      const resourceData = { resourceType: 'Patient', name: [{ family: 'Doe' }] };
      const mockCreatedResource = { id: '123', ...resourceData };
      const mockValidation: any = { errors: [] };

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      const mockCreateOperation = {
        execute: jest.fn().mockResolvedValue(mockCreatedResource)
      };
      MockCreateOperation.mockImplementation(() => mockCreateOperation as any);

      const result = await service.create('Patient', resourceData);

      expect(result).toEqual(mockCreatedResource);
      expect(mockValidationService.validateResource).toHaveBeenCalledWith(resourceData);
      expect(mockCreateOperation.execute).toHaveBeenCalledWith('Patient', resourceData);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(FhirEvent.CREATED, {
        resourceType: 'Patient',
        request: mockRequest,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(ResourceEvent.CREATED, {
        resourceType: 'Patient',
        id: '123',
        resource: mockCreatedResource
      });
    });

    it('should return validation errors when resource is invalid', async () => {
      const resourceData = { resourceType: 'Patient' };
      const mockValidation: any = { errors: [{ message: 'Required field missing' }] };
      const mockResponse = { status: 400, message: 'Validation failed' };

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      MockFhirResponse.notValid = jest.fn().mockReturnValue(mockResponse);

      const result = await service.create('Patient', resourceData);

      expect(result).toEqual(mockResponse);
      expect(MockFhirResponse.notValid).toHaveBeenCalledWith(mockValidation);
    });

    it('should handle NotAcceptableException', async () => {
      const resourceData = { resourceType: 'Patient' };
      const mockValidation: any = { errors: [] };
      const notAcceptableError = new NotAcceptableException('Resource not acceptable');
      const mockResponse = { status: 406, message: 'Not Acceptable' };

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      const mockCreateOperation = {
        execute: jest.fn().mockRejectedValue(notAcceptableError)
      };
      MockCreateOperation.mockImplementation(() => mockCreateOperation as any);
      MockFhirResponse.notAcceptable = jest.fn().mockReturnValue(mockResponse);

      const result = await service.create('Patient', resourceData);

      expect(result).toEqual(mockResponse);
      expect(MockFhirResponse.notAcceptable).toHaveBeenCalledWith('Resource not acceptable');
    });
  });

  describe('update', () => {
    it('should update resource successfully', async () => {
      const resourceData = { id: '123', resourceType: 'Patient', name: [{ family: 'Smith' }] };
      const mockUpdatedResource = { ...resourceData, meta: { versionId: '2' } };
      const mockValidation: any = { errors: [] };

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      const mockUpdateOperation = {
        execute: jest.fn().mockResolvedValue(mockUpdatedResource)
      };
      MockUpdateOperation.mockImplementation(() => mockUpdateOperation as any);

      const result = await service.update('Patient', '123', resourceData);

      expect(result).toEqual(mockUpdatedResource);
      expect(mockValidationService.validateResource).toHaveBeenCalledWith(resourceData);
      expect(mockUpdateOperation.execute).toHaveBeenCalledWith('Patient', '123', resourceData);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(FhirEvent.UPDATED, {
        resourceType: 'Patient',
        id: '123',
        request: mockRequest
      });
    });

    it('should return validation errors when resource is invalid', async () => {
      const resourceData = { id: '123', resourceType: 'Patient' };
      const mockValidation: any = { errors: [{ message: 'Invalid resource' }] };
      const mockResponse = { status: 400, message: 'Validation failed' };

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      MockFhirResponse.notValid = jest.fn().mockReturnValue(mockResponse);

      const result = await service.update('Patient', '123', resourceData);

      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when resource not found', async () => {
      const resourceData = { id: '123', resourceType: 'Patient' };
      const mockValidation: any = { errors: [] };
      const notFoundError = new NotFoundException('Resource not found');

      mockValidationService.validateResource.mockResolvedValue(mockValidation);
      const mockUpdateOperation = {
        execute: jest.fn().mockRejectedValue(notFoundError)
      };
      MockUpdateOperation.mockImplementation(() => mockUpdateOperation as any);

      await expect(service.update('Patient', '123', resourceData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete resource successfully', async () => {
      const mockResult = { resourceType: 'OperationOutcome', issue: [] };
      const mockDeleteOperation = {
        execute: jest.fn().mockResolvedValue(mockResult)
      };
      MockDeleteOperation.mockImplementation(() => mockDeleteOperation as any);

      const result = await service.delete('Patient', '123');

      expect(result).toEqual(mockResult);
      expect(mockDeleteOperation.execute).toHaveBeenCalledWith('Patient', '123');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(FhirEvent.DELETED, {
        resourceType: 'Patient',
        id: '123',
        request: mockRequest
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(ResourceEvent.DELETED, {
        resourceType: 'Patient',
        id: '123'
      });
    });

    it('should handle NotFoundException', async () => {
      const notFoundError = new NotFoundException('Resource not found');
      const mockResponse = { status: 404, message: 'Not Found' };
      const mockDeleteOperation = {
        execute: jest.fn().mockRejectedValue(notFoundError)
      };
      MockDeleteOperation.mockImplementation(() => mockDeleteOperation as any);
      MockFhirResponse.notFound = jest.fn().mockReturnValue(mockResponse);

      const result = await service.delete('Patient', '123');

      expect(result).toEqual(mockResponse);
      expect(MockFhirResponse.notFound).toHaveBeenCalledWith('Resource not found');
    });
  });

  describe('getMetaData', () => {
    it('should return metadata successfully', async () => {
      const mockMetadata = { resourceType: 'CapabilityStatement' };
      const mockMetadataInstance = {
        get: jest.fn().mockReturnValue(mockMetadata)
      };
      MockMetadata.mockImplementation(() => mockMetadataInstance as any);

      const result = await service.getMetaData();

      expect(result).toEqual(mockMetadata);
      expect(mockStructureDefinitionModel.find).toHaveBeenCalledWith({}, {type: 1, url: 1, _id: 0});
      expect(mockMetadataInstance.get).toHaveBeenCalledWith([
        { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' },
        { type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' }
      ]);
    });
  });

  describe('checkPreRequest', () => {
    it('should pass validation for valid POST request', async () => {
      const resourceData = { resourceType: 'Patient' };

      await expect(service.checkPreRequest('POST', 'Patient', resourceData)).resolves.not.toThrow();
    });

    it('should throw BadRequestException for POST with mismatched resourceType', async () => {
      const resourceData = { resourceType: 'Observation' };

      await expect(service.checkPreRequest('POST', 'Patient', resourceData))
        .rejects.toThrow(BadRequestException);
    });

    it('should pass validation for valid PUT request', async () => {
      const resourceData = { id: '123', resourceType: 'Patient' };

      await expect(service.checkPreRequest('PUT', 'Patient', resourceData, '123')).resolves.not.toThrow();
    });

    it('should throw BadRequestException for PUT without ID', async () => {
      const resourceData = { resourceType: 'Patient' };

      await expect(service.checkPreRequest('PUT', 'Patient', resourceData))
        .rejects.toThrow('ID is required for PUT operation');
    });

    it('should throw BadRequestException for PUT with mismatched ID', async () => {
      const resourceData = { id: '456', resourceType: 'Patient' };

      await expect(service.checkPreRequest('PUT', 'Patient', resourceData, '123'))
        .rejects.toThrow('ID in the URL (123) does not match the ID in the request body. (456');
    });

    it('should throw BadRequestException for unsupported HTTP method', async () => {
      const resourceData = { resourceType: 'Patient' };

      await expect(service.checkPreRequest('PATCH' as any, 'Patient', resourceData))
        .rejects.toThrow('Unsupported HTTP method: PATCH');
    });
  });
});