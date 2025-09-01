import { Test, TestingModule } from '@nestjs/testing';
import { ValueSetController } from './value-set.controller';
import { ValueSetService } from '../services/value-set/value-set.service';
import { CreateValueSetDto } from '../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../dto/update-value-set-dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizerGuard } from '../guards/authorizer/authorizer.guard';
import { ValueSetStatus } from '../schema/value-set.schema';

/**
 * Tests ValueSetController REST API endpoints for FHIR ValueSet operations
 * Covers HTTP operations, query filtering, error handling, and FHIR-specific operations like expand and validateCode
 */
describe('ValueSetController', () => {
  let controller: ValueSetController;
  let service: ValueSetService;

  const mockValueSetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByStatus: jest.fn(),
    findByUrl: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    expand: jest.fn(),
    validateCode: jest.fn(),
  };

  const mockValueSetId = '123e4567-e89b-12d3-a456-426614174000';
  const mockValueSet = {
    _id: mockValueSetId,
    id: mockValueSetId,
    url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
    name: 'AdministrativeGender',
    title: 'Administrative Gender',
    status: ValueSetStatus.ACTIVE,
    description: 'The gender of a person used for administrative purposes',
    resourceType: 'ValueSet',
    compose: {
      include: [{
        system: 'http://hl7.org/fhir/administrative-gender',
        concept: [
          { code: 'male', display: 'Male' },
          { code: 'female', display: 'Female' }
        ]
      }]
    },
    meta: {
      versionId: '1',
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    }
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-value')
    };

    const mockAuthorizerGuard = {
      canActivate: jest.fn().mockReturnValue(true)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValueSetController],
      providers: [
        {
          provide: ValueSetService,
          useValue: mockValueSetService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: AuthorizerGuard,
          useValue: mockAuthorizerGuard
        }
      ],
    }).compile();

    controller = module.get<ValueSetController>(ValueSetController);
    service = module.get<ValueSetService>(ValueSetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a value set', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
        name: 'AdministrativeGender',
        title: 'Administrative Gender',
        status: ValueSetStatus.ACTIVE,
        description: 'Test value set',
        compose: {
          include: [{
            system: 'http://hl7.org/fhir/administrative-gender',
            concept: [{ code: 'male', display: 'Male' }]
          }]
        }
      };

      mockValueSetService.create.mockResolvedValue(mockValueSet);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockValueSet);
    });

    it('should handle service errors during creation', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/test',
        status: ValueSetStatus.ACTIVE,
        description: 'Test'
      };

      mockValueSetService.create.mockRejectedValue(
        new BadRequestException('URL already exists')
      );

      await expect(controller.create(createDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all value sets without filters', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by status', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(ValueSetStatus.ACTIVE);

      expect(service.findAll).toHaveBeenCalledWith({ status: ValueSetStatus.ACTIVE });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by name pattern', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(undefined, 'Gender');

      expect(service.findAll).toHaveBeenCalledWith({
        name: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by URL pattern', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(undefined, undefined, 'administrative');

      expect(service.findAll).toHaveBeenCalledWith({
        url: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by publisher', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(undefined, undefined, undefined, 'HL7');

      expect(service.findAll).toHaveBeenCalledWith({
        publisher: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets with multiple filters', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(ValueSetStatus.ACTIVE, 'Gender', 'administrative', 'HL7');

      expect(service.findAll).toHaveBeenCalledWith({
        status: ValueSetStatus.ACTIVE,
        name: expect.any(RegExp),
        url: expect.any(RegExp),
        publisher: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should handle empty results', async () => {
      mockValueSetService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should escape regex characters in filters', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      await controller.findAll(undefined, 'test.*special', 'test+special');

      const expectedFilter = {
        name: expect.any(RegExp),
        url: expect.any(RegExp)
      };
      expect(service.findAll).toHaveBeenCalledWith(expectedFilter);

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.name.source).toBe('test\\.\\*special');
      expect(actualCall.url.source).toBe('test\\+special');
    });
  });

  describe('findByStatus', () => {
    it('should return value sets by status', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findByStatus.mockResolvedValue(mockValueSets);

      const result = await controller.findByStatus(ValueSetStatus.ACTIVE);

      expect(service.findByStatus).toHaveBeenCalledWith(ValueSetStatus.ACTIVE);
      expect(result).toEqual(mockValueSets);
    });

    it('should handle empty results for status', async () => {
      mockValueSetService.findByStatus.mockResolvedValue([]);

      const result = await controller.findByStatus(ValueSetStatus.RETIRED);

      expect(service.findByStatus).toHaveBeenCalledWith(ValueSetStatus.RETIRED);
      expect(result).toEqual([]);
    });
  });

  describe('findByUrl', () => {
    it('should return value set by URL', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/administrative-gender';
      mockValueSetService.findByUrl.mockResolvedValue(mockValueSet);

      const result = await controller.findByUrl(url);

      expect(service.findByUrl).toHaveBeenCalledWith(url);
      expect(result).toEqual(mockValueSet);
    });

    it('should handle not found error', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/non-existent';
      mockValueSetService.findByUrl.mockRejectedValue(
        new NotFoundException(`ValueSet with URL '${url}' not found`)
      );

      await expect(controller.findByUrl(url)).rejects.toThrow(NotFoundException);
      expect(service.findByUrl).toHaveBeenCalledWith(url);
    });
  });

  describe('findOne', () => {
    it('should return value set by ID', async () => {
      mockValueSetService.findOne.mockResolvedValue(mockValueSet);

      const result = await controller.findOne(mockValueSetId);

      expect(service.findOne).toHaveBeenCalledWith(mockValueSetId);
      expect(result).toEqual(mockValueSet);
    });

    it('should handle invalid ID error', async () => {
      const invalidId = '';
      mockValueSetService.findOne.mockRejectedValue(
        new BadRequestException('Invalid ValueSet ID')
      );

      await expect(controller.findOne(invalidId)).rejects.toThrow(BadRequestException);
      expect(service.findOne).toHaveBeenCalledWith(invalidId);
    });

    it('should handle not found error', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      mockValueSetService.findOne.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update value set', async () => {
      const updateDto: UpdateValueSetDto = {
        description: 'Updated description',
        status: ValueSetStatus.DRAFT
      };

      const updatedValueSet = {
        ...mockValueSet,
        ...updateDto,
        meta: {
          versionId: '2',
          lastUpdated: new Date('2023-01-02T00:00:00.000Z')
        }
      };

      mockValueSetService.update.mockResolvedValue(updatedValueSet);

      const result = await controller.update(mockValueSetId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockValueSetId, updateDto);
      expect(result).toEqual(updatedValueSet);
    });

    it('should handle not found error during update', async () => {
      const updateDto: UpdateValueSetDto = {
        description: 'Updated'
      };

      mockValueSetService.update.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.update(mockValueSetId, updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(mockValueSetId, updateDto);
    });

    it('should handle URL conflict error during update', async () => {
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/existing-url'
      };

      mockValueSetService.update.mockRejectedValue(
        new BadRequestException('ValueSet with URL already exists')
      );

      await expect(controller.update(mockValueSetId, updateDto)).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith(mockValueSetId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete value set', async () => {
      mockValueSetService.delete.mockResolvedValue(undefined);

      await controller.remove(mockValueSetId);

      expect(service.delete).toHaveBeenCalledWith(mockValueSetId);
    });

    it('should handle not found error during deletion', async () => {
      mockValueSetService.delete.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.remove(mockValueSetId)).rejects.toThrow(NotFoundException);
      expect(service.delete).toHaveBeenCalledWith(mockValueSetId);
    });
  });

  /** Tests FHIR ValueSet $expand operation endpoint */
  describe('expand', () => {
    it('should expand value set', async () => {
      const expandedValueSet = {
        ...mockValueSet,
        expansion: {
          timestamp: new Date(),
          contains: [
            { system: 'http://hl7.org/fhir/administrative-gender', code: 'male', display: 'Male' },
            { system: 'http://hl7.org/fhir/administrative-gender', code: 'female', display: 'Female' }
          ]
        }
      };

      mockValueSetService.expand.mockResolvedValue(expandedValueSet);

      const result = await controller.expand(mockValueSetId);

      expect(service.expand).toHaveBeenCalledWith(mockValueSetId);
      expect(result).toEqual(expandedValueSet);
    });

    it('should handle not found error during expand', async () => {
      mockValueSetService.expand.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.expand(mockValueSetId)).rejects.toThrow(NotFoundException);
      expect(service.expand).toHaveBeenCalledWith(mockValueSetId);
    });
  });

  /** Tests FHIR ValueSet $validate-code operation endpoint */
  describe('validateCode', () => {
    it('should validate code successfully', async () => {
      mockValueSetService.validateCode.mockResolvedValue(true);

      const result = await controller.validateCode(
        mockValueSetId,
        'http://hl7.org/fhir/administrative-gender',
        'male'
      );

      expect(service.validateCode).toHaveBeenCalledWith(
        mockValueSetId,
        'http://hl7.org/fhir/administrative-gender',
        'male'
      );
      expect(result).toEqual({ result: true });
    });

    it('should return false for invalid code', async () => {
      mockValueSetService.validateCode.mockResolvedValue(false);

      const result = await controller.validateCode(
        mockValueSetId,
        'http://hl7.org/fhir/administrative-gender',
        'invalid'
      );

      expect(service.validateCode).toHaveBeenCalledWith(
        mockValueSetId,
        'http://hl7.org/fhir/administrative-gender',
        'invalid'
      );
      expect(result).toEqual({ result: false });
    });

    it('should handle not found error during validation', async () => {
      mockValueSetService.validateCode.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.validateCode(
        mockValueSetId,
        'http://hl7.org/fhir/administrative-gender',
        'male'
      )).rejects.toThrow(NotFoundException);
    });
  });

  /** Tests regex escaping for search parameter safety */
  describe('escapeRegexCharacters', () => {
    it('should escape regex characters correctly', () => {
      expect((controller as any).escapeRegexCharacters('test')).toBe('test');
      expect((controller as any).escapeRegexCharacters('test.*special')).toBe('test\\.\\*special');
      expect((controller as any).escapeRegexCharacters('test+?^${}()|[]\\special')).toBe('test\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\special');
      expect((controller as any).escapeRegexCharacters('')).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string filters', async () => {
      mockValueSetService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(undefined, '', '', '');

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should handle null/undefined filters', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      const result = await controller.findAll(undefined, undefined, undefined, undefined);

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([mockValueSet]);
    });

    it('should handle service throwing unexpected errors', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/test',
        status: ValueSetStatus.ACTIVE,
        description: 'Test'
      };

      mockValueSetService.create.mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.create(createDto)).rejects.toThrow('Unexpected error');
    });

    it('should handle complex compose objects in create', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/complex',
        status: ValueSetStatus.ACTIVE,
        name: 'ComplexValueSet',
        compose: {
          include: [
            {
              system: 'http://snomed.info/sct',
              concept: [
                {
                  code: '271649006',
                  display: 'Systolic blood pressure'
                }
              ]
            }
          ]
        }
      };

      const complexValueSet = { ...mockValueSet, ...createDto };
      mockValueSetService.create.mockResolvedValue(complexValueSet);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(complexValueSet);
    });

    it('should handle special characters in filters', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      await controller.findAll(undefined, 'test&special', 'http://test.com/ValueSet/special&chars');

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.name.source).toBe('test&special');
      expect(actualCall.url.source).toBe('http:\\/\\/test\\.com\\/ValueSet\\/special&chars');
    });

    it('should handle case insensitive matching', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      await controller.findAll(undefined, 'Gender');

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.name.flags).toBe('i');
    });

    it('should handle mixed parameter combinations', async () => {
      const testCases = [
        { status: ValueSetStatus.ACTIVE, name: undefined, url: undefined, publisher: undefined },
        { status: undefined, name: 'test', url: undefined, publisher: undefined },
        { status: undefined, name: undefined, url: 'test', publisher: undefined },
        { status: undefined, name: undefined, url: undefined, publisher: 'test' },
        { status: ValueSetStatus.DRAFT, name: 'custom', url: 'custom', publisher: 'custom' }
      ];

      for (const testCase of testCases) {
        mockValueSetService.findAll.mockClear();
        mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

        await controller.findAll(testCase.status, testCase.name, testCase.url, testCase.publisher);

        const expectedFilter: any = {};

        if (testCase.status) {
          expectedFilter.status = testCase.status;
        }

        if (testCase.name) {
          expectedFilter.name = expect.any(RegExp);
        }

        if (testCase.url) {
          expectedFilter.url = expect.any(RegExp);
        }

        if (testCase.publisher) {
          expectedFilter.publisher = expect.any(RegExp);
        }

        expect(service.findAll).toHaveBeenCalledWith(expectedFilter);
      }
    });
  });
});