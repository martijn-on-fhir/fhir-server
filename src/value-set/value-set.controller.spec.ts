import { Test, TestingModule } from '@nestjs/testing';
import { ValueSetController } from './value-set.controller';
import { ValueSetService } from '../services/value-set/value-set.service';
import { CreateValueSetDto } from '../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../dto/update-value-set-dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizerGuard } from '../guards/authorizer/authorizer.guard';

describe('ValueSetController', () => {
  let controller: ValueSetController;
  let service: ValueSetService;

  const mockValueSetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUrl: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockValueSet = {
    _id: '507f1f77bcf86cd799439011',
    url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
    resourceType: 'ValueSet',
    expansion: [
      {
        system: 'http://hl7.org/fhir/administrative-gender',
        code: 'male',
        display: 'Male'
      },
      {
        system: 'http://hl7.org/fhir/administrative-gender',
        code: 'female',
        display: 'Female'
      }
    ],
    value: {
      resourceType: 'ValueSet',
      id: 'administrative-gender',
      url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
      name: 'AdministrativeGender',
      status: 'active'
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
        resourceType: 'ValueSet',
        expansion: [
          {
            system: 'http://hl7.org/fhir/administrative-gender',
            code: 'male',
            display: 'Male'
          }
        ],
        value: {
          resourceType: 'ValueSet',
          id: 'administrative-gender',
          name: 'AdministrativeGender',
          status: 'active'
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
        expansion: [],
        value: { resourceType: 'ValueSet' }
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

    it('should return filtered value sets by resourceType', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll('ValueSet');

      expect(service.findAll).toHaveBeenCalledWith({ resourceType: 'ValueSet' });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by URL pattern', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll(undefined, 'gender');

      expect(service.findAll).toHaveBeenCalledWith({
        url: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should return filtered value sets by both resourceType and URL', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      const result = await controller.findAll('ValueSet', 'gender');

      expect(service.findAll).toHaveBeenCalledWith({
        resourceType: 'ValueSet',
        url: expect.any(RegExp)
      });
      expect(result).toEqual(mockValueSets);
    });

    it('should handle empty results', async () => {
      mockValueSetService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should escape regex characters in URL filter', async () => {
      const mockValueSets = [mockValueSet];
      mockValueSetService.findAll.mockResolvedValue(mockValueSets);

      await controller.findAll(undefined, 'test.*special');

      const expectedFilter = { url: expect.any(RegExp) };
      expect(service.findAll).toHaveBeenCalledWith(expectedFilter);

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.url.source).toBe('test\\.\\*special');
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
      const id = '507f1f77bcf86cd799439011';
      mockValueSetService.findOne.mockResolvedValue(mockValueSet);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockValueSet);
    });

    it('should handle invalid ID error', async () => {
      const invalidId = 'invalid-id';
      mockValueSetService.findOne.mockRejectedValue(
        new BadRequestException('Invalid ValueSet ID')
      );

      await expect(controller.findOne(invalidId)).rejects.toThrow(BadRequestException);
      expect(service.findOne).toHaveBeenCalledWith(invalidId);
    });

    it('should handle not found error', async () => {
      const id = '507f1f77bcf86cd799439012';
      mockValueSetService.findOne.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update value set', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/updated-gender',
        expansion: [
          {
            system: 'http://hl7.org/fhir/administrative-gender',
            code: 'unknown',
            display: 'Unknown'
          }
        ]
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

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(updatedValueSet);
    });

    it('should handle not found error during update', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/updated'
      };

      mockValueSetService.update.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should handle URL conflict error during update', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/existing-url'
      };

      mockValueSetService.update.mockRejectedValue(
        new BadRequestException('ValueSet with URL already exists')
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete value set', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockValueSetService.delete.mockResolvedValue(undefined);

      await controller.remove(id);

      expect(service.delete).toHaveBeenCalledWith(id);
    });

    it('should handle not found error during deletion', async () => {
      const id = '507f1f77bcf86cd799439012';
      mockValueSetService.delete.mockRejectedValue(
        new NotFoundException('ValueSet not found')
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(service.delete).toHaveBeenCalledWith(id);
    });
  });

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

      const result = await controller.findAll('', '');

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should handle null/undefined filters', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      const result = await controller.findAll(undefined, undefined);

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([mockValueSet]);
    });

    it('should handle service throwing unexpected errors', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/test',
        expansion: [],
        value: { resourceType: 'ValueSet' }
      };

      mockValueSetService.create.mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.create(createDto)).rejects.toThrow('Unexpected error');
    });

    it('should handle complex expansion objects in create', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/complex',
        expansion: [
          {
            system: 'http://snomed.info/sct',
            code: '271649006',
            display: 'Systolic blood pressure',
            contains: [
              {
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }
            ]
          }
        ],
        value: {
          resourceType: 'ValueSet',
          id: 'complex',
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
        }
      };

      const complexValueSet = { ...mockValueSet, ...createDto };
      mockValueSetService.create.mockResolvedValue(complexValueSet);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(complexValueSet);
    });

    it('should handle special characters in URL filters', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      await controller.findAll(undefined, 'http://test.com/ValueSet/special&chars');

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.url.source).toBe('http:\\/\\/test\\.com\\/ValueSet\\/special&chars');
    });

    it('should handle case insensitive URL matching', async () => {
      mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

      await controller.findAll(undefined, 'Gender');

      const actualCall = mockValueSetService.findAll.mock.calls[0][0];
      expect(actualCall.url.flags).toBe('i');
    });

    it('should handle mixed parameter combinations', async () => {
      const testCases = [
        { resourceType: 'ValueSet', url: undefined },
        { resourceType: undefined, url: 'test' },
        { resourceType: 'CustomValueSet', url: 'custom' },
        { resourceType: '', url: '' }
      ];

      for (const testCase of testCases) {
        mockValueSetService.findAll.mockClear();
        mockValueSetService.findAll.mockResolvedValue([mockValueSet]);

        await controller.findAll(testCase.resourceType, testCase.url);

        const expectedFilter: any = {};

        if (testCase.resourceType) {
          expectedFilter.resourceType = testCase.resourceType;
        }

        if (testCase.url) {
          expectedFilter.url = expect.any(RegExp);
        }

        expect(service.findAll).toHaveBeenCalledWith(expectedFilter);
      }
    });
  });
});