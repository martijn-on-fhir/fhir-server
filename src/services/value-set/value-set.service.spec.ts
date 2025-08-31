import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ValueSetService } from './value-set.service';
import { ValueSetDocument, ValueSetSchema } from '../../schema/value-set-schema';
import { CreateValueSetDto } from '../../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../../dto/update-value-set-dto';

describe('ValueSetService', () => {
  let service: ValueSetService;

  const mockValueSet = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
    },
    save: jest.fn(),
    toObject: jest.fn()
  };

  const mockValueSetModel = {
    new: jest.fn(),
    constructor: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
    sort: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValueSetService,
        {
          provide: getModelToken(ValueSetSchema.name),
          useValue: mockValueSetModel,
        },
      ],
    }).compile();

    service = module.get<ValueSetService>(ValueSetService);
    module.get<Model<ValueSetDocument>>(getModelToken(ValueSetSchema.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new value set', async () => {
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

      const mockSavedValueSet = {
        ...mockValueSet,
        ...createDto
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedValueSet);
      const mockConstructor: any = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));

      mockConstructor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (service as any).valueSetModel = mockConstructor;

      const result = await service.create(createDto);

      expect(mockConstructor).toHaveBeenCalledWith(expect.objectContaining({
        ...createDto,
        meta: {
          versionId: '1',
          lastUpdated: expect.any(Date)
        }
      }));
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedValueSet);
    });

    it('should throw BadRequestException if URL already exists', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
        expansion: [],
        value: { resourceType: 'ValueSet' }
      };

      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('ValueSet with URL \'http://hl7.org/fhir/ValueSet/administrative-gender\' already exists')
      );
    });

    it('should handle database errors during creation', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/test',
        expansion: [],
        value: { resourceType: 'ValueSet' }
      };

      const mockConstructor: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      mockConstructor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (service as any).valueSetModel = mockConstructor;

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all value sets without filter', async () => {
      const mockResults = [mockValueSet];
      
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll();

      expect(mockValueSetModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResults);
    });

    it('should return filtered value sets', async () => {
      const filter = { resourceType: 'ValueSet' };
      const mockResults = [mockValueSet];
      
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll(filter);

      expect(mockValueSetModel.find).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no results found', async () => {
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([])
        })
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should sort results by url', async () => {
      const mockResults = [mockValueSet];
      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResults)
      });
      
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      await service.findAll();

      expect(mockSort).toHaveBeenCalledWith({ url: 1 });
    });
  });

  describe('findByUrl', () => {
    it('should return value set by URL', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/administrative-gender';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const result = await service.findByUrl(url);

      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url: { $eq: url } });
      expect(result).toEqual(mockValueSet);
    });

    it('should throw NotFoundException when value set not found by URL', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/non-existent';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findByUrl(url)).rejects.toThrow(
        new NotFoundException(`ValueSet with URL '${url}' not found`)
      );
    });
  });

  describe('findOne', () => {
    it('should return value set by valid ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      
      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const result = await service.findOne(id);

      expect(mockValueSetModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockValueSet);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        new BadRequestException('Invalid ValueSet ID')
      );
    });

    it('should throw NotFoundException when value set not found by ID', async () => {
      const id = '507f1f77bcf86cd799439012';
      
      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException('ValueSet not found')
      );
    });
  });

  describe('update', () => {
    it('should update value set successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        expansion: [
          {
            system: 'http://hl7.org/fhir/administrative-gender',
            code: 'unknown',
            display: 'Unknown'
          }
        ]
      };

      const existingValueSet = {
        ...mockValueSet,
        save: jest.fn().mockResolvedValue({
          ...mockValueSet,
          ...updateDto
        })
      };

      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingValueSet)
      });

      const result = await service.update(id, updateDto);

      expect(existingValueSet.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it('should validate URL uniqueness when updating URL', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/new-url'
      };

      const existingValueSet = {
        ...mockValueSet,
        url: 'http://hl7.org/fhir/ValueSet/old-url',
        save: jest.fn().mockResolvedValue({
          ...mockValueSet,
          ...updateDto
        })
      };

      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingValueSet)
      });

      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await service.update(id, updateDto);

      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url: updateDto.url });
      expect(existingValueSet.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it('should not validate URL uniqueness when URL is not changed', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        expansion: []
      };

      const existingValueSet = {
        ...mockValueSet,
        save: jest.fn().mockResolvedValue({
          ...mockValueSet,
          ...updateDto
        })
      };

      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingValueSet)
      });

      const findOneSpy = jest.spyOn(mockValueSetModel, 'findOne');

      await service.update(id, updateDto);

      expect(findOneSpy).not.toHaveBeenCalled();
      expect(existingValueSet.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when new URL already exists', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/existing-url'
      };

      const existingValueSet = {
        ...mockValueSet,
        url: 'http://hl7.org/fhir/ValueSet/old-url'
      };

      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingValueSet)
      });

      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'other-id' })
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(
        new BadRequestException('ValueSet with URL \'http://hl7.org/fhir/ValueSet/existing-url\' already exists')
      );
    });

    it('should throw NotFoundException when value set to update not found', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateValueSetDto = {
        expansion: []
      };

      mockValueSetModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(
        new NotFoundException('ValueSet not found')
      );
    });
  });

  describe('delete', () => {
    it('should delete value set successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      
      mockValueSetModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await service.delete(id);

      expect(mockValueSetModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when value set to delete not found', async () => {
      const id = '507f1f77bcf86cd799439012';
      
      mockValueSetModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.delete(id)).rejects.toThrow(
        new NotFoundException('ValueSet not found')
      );
    });
  });

  describe('validateUrlUniqueness', () => {
    it('should pass validation when URL is unique', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/unique-url';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service['validateUrlUniqueness'](url)).resolves.not.toThrow();
      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url });
    });

    it('should pass validation when URL exists but is excluded', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/existing-url';
      const excludeId = '507f1f77bcf86cd799439011';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service['validateUrlUniqueness'](url, excludeId)).resolves.not.toThrow();
      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({
        url,
        _id: { $ne: excludeId }
      });
    });

    it('should throw BadRequestException when URL already exists', async () => {
      const url = 'http://hl7.org/fhir/ValueSet/existing-url';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await expect(service['validateUrlUniqueness'](url)).rejects.toThrow(
        new BadRequestException(`ValueSet with URL '${url}' already exists`)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty filter in findAll', async () => {
      const mockResults = [mockValueSet];
      
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll({});

      expect(mockValueSetModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResults);
    });

    it('should handle complex filter objects in findAll', async () => {
      const complexFilter = {
        resourceType: 'ValueSet',
        'value.status': 'active',
        url: /gender/i
      };
      const mockResults = [mockValueSet];
      
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll(complexFilter);

      expect(mockValueSetModel.find).toHaveBeenCalledWith(complexFilter);
      expect(result).toEqual(mockResults);
    });

    it('should handle database connection errors', async () => {
      mockValueSetModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('Connection lost'))
        })
      });

      await expect(service.findAll()).rejects.toThrow('Connection lost');
    });

    it('should handle ObjectId edge cases', async () => {
      const edgeCaseIds = [
        '',
        'null',
        'undefined',
        '123',
        'invalid-object-id',
        '507f1f77bcf86cd79943901',
        '507f1f77bcf86cd799439011z'
      ];

      for (const id of edgeCaseIds) {
        await expect(service.findOne(id)).rejects.toThrow(BadRequestException);
      }
    });

    it('should handle URL with special characters', async () => {
      const specialUrl = 'http://example.com/fhir/ValueSet/Special%20Characters&Test';
      
      mockValueSetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const result = await service.findByUrl(specialUrl);

      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({
        url: { $eq: specialUrl }
      });
      expect(result).toEqual(mockValueSet);
    });

    it('should handle empty expansion arrays', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://hl7.org/fhir/ValueSet/empty-expansion',
        expansion: [],
        value: { resourceType: 'ValueSet' }
      };

      const mockConstructor: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ ...mockValueSet, ...createDto })
      }));

      mockConstructor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (service as any).valueSetModel = mockConstructor;

      const result = await service.create(createDto);

      expect(result.expansion).toEqual([]);
    });
  });
});