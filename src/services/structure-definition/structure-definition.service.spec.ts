import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { StructureDefinitionService } from './structure-definition.service';
import { StructureDefinitionDocument, StructureDefinitionSchema } from '../../schema/structure-definition.schema';
import { CreateStructureDefinitionDto } from '../../dto/create-structure-definition-dto';
import { UpdateStructureDefinitionDto } from '../../dto/update-structure-definition-dto';

describe('StructureDefinitionService', () => {
  let service: StructureDefinitionService;

  const mockStructureDefinition = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    resourceType: 'StructureDefinition',
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    release: 4,
    definition: {
      kind: 'resource',
      abstract: false,
      type: 'Patient',
      baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
    },
    meta: {
      versionId: '1',
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    },
    save: jest.fn(),
    toObject: jest.fn()
  };

  const mockStructureDefinitionModel = {
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
        StructureDefinitionService,
        {
          provide: getModelToken(StructureDefinitionSchema.name),
          useValue: mockStructureDefinitionModel,
        },
      ],
    }).compile();

    service = module.get<StructureDefinitionService>(StructureDefinitionService);
    module.get<Model<StructureDefinitionDocument>>(getModelToken(StructureDefinitionSchema.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new structure definition', async () => {
      const createDto: CreateStructureDefinitionDto = {
        resourceType: 'StructureDefinition',
        url: 'http://hl7.org/fhir/StructureDefinition/Patient',
        release: 4,
        definition: {
          kind: 'resource',
          abstract: false,
          type: 'Patient',
          baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
        }
      };

      const mockSavedStructureDefinition = {
        ...mockStructureDefinition,
        ...createDto
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedStructureDefinition);
      const mockConstructor: any = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));

      // Add the necessary methods to the mock constructor
      mockConstructor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // Replace the model in the service
      (service as any).structureDefinitionModel = mockConstructor;

      const result = await service.create(createDto);

      expect(mockConstructor).toHaveBeenCalledWith(expect.objectContaining({
        ...createDto,
        meta: {
          versionId: '1',
          lastUpdated: expect.any(Date)
        }
      }));
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedStructureDefinition);
    });

    it('should throw BadRequestException if URL already exists', async () => {
      const createDto: CreateStructureDefinitionDto = {
        resourceType: 'StructureDefinition',
        url: 'http://hl7.org/fhir/StructureDefinition/Patient',
        release: 4,
        definition: { kind: 'resource' }
      };

      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('StructureDefinition with URL \'http://hl7.org/fhir/StructureDefinition/Patient\' already exists')
      );
    });

    it('should handle database errors during creation', async () => {
      const createDto: CreateStructureDefinitionDto = {
        resourceType: 'StructureDefinition',
        url: 'http://hl7.org/fhir/StructureDefinition/Patient',
        release: 4,
        definition: { kind: 'resource' }
      };

      const mockConstructor: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      // Mock URL uniqueness check to pass
      mockConstructor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (service as any).structureDefinitionModel = mockConstructor;

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all structure definitions without filter', async () => {
      const mockResults = [mockStructureDefinition];
      
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll();

      expect(mockStructureDefinitionModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResults);
    });

    it('should return filtered structure definitions', async () => {
      const filter = { resourceType: 'StructureDefinition' };
      const mockResults = [mockStructureDefinition];
      
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll(filter);

      expect(mockStructureDefinitionModel.find).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no results found', async () => {
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([])
        })
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should sort results by url', async () => {
      const mockResults = [mockStructureDefinition];
      const mockSort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResults)
      });
      
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      await service.findAll();

      expect(mockSort).toHaveBeenCalledWith({ url: 1 });
    });
  });

  describe('findByUrl', () => {
    it('should return structure definition by URL', async () => {
      const url = 'http://hl7.org/fhir/StructureDefinition/Patient';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      const result = await service.findByUrl(url);

      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({ url: { $eq: url } });
      expect(result).toEqual(mockStructureDefinition);
    });

    it('should throw NotFoundException when structure definition not found by URL', async () => {
      const url = 'http://hl7.org/fhir/StructureDefinition/NonExistent';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findByUrl(url)).rejects.toThrow(
        new NotFoundException(`StructureDefinition with URL '${url}' not found`)
      );
    });
  });

  describe('findOne', () => {
    it('should return structure definition by valid ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      
      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      const result = await service.findOne(id);

      expect(mockStructureDefinitionModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockStructureDefinition);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        new BadRequestException('Invalid StructureDefinition ID')
      );
    });

    it('should throw NotFoundException when structure definition not found by ID', async () => {
      const id = '507f1f77bcf86cd799439012';
      
      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException('StructureDefinition not found')
      );
    });
  });

  describe('update', () => {
    it('should update structure definition successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStructureDefinitionDto = {
        definition: {
          kind: 'resource',
          abstract: false,
          type: 'UpdatedPatient'
        }
      };

      const existingStructureDefinition = {
        ...mockStructureDefinition,
        save: jest.fn().mockResolvedValue({
          ...mockStructureDefinition,
          ...updateDto
        })
      };

      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingStructureDefinition)
      });

      const result = await service.update(id, updateDto);

      expect(existingStructureDefinition.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it('should validate URL uniqueness when updating URL', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStructureDefinitionDto = {
        url: 'http://hl7.org/fhir/StructureDefinition/NewURL'
      };

      const existingStructureDefinition = {
        ...mockStructureDefinition,
        url: 'http://hl7.org/fhir/StructureDefinition/OldURL',
        save: jest.fn().mockResolvedValue({
          ...mockStructureDefinition,
          ...updateDto
        })
      };

      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingStructureDefinition)
      });

      // Mock URL uniqueness check
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await service.update(id, updateDto);

      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({ url: updateDto.url });
      expect(existingStructureDefinition.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it('should not validate URL uniqueness when URL is not changed', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStructureDefinitionDto = {
        definition: { kind: 'resource' }
      };

      const existingStructureDefinition = {
        ...mockStructureDefinition,
        save: jest.fn().mockResolvedValue({
          ...mockStructureDefinition,
          ...updateDto
        })
      };

      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingStructureDefinition)
      });

      const findOneSpy = jest.spyOn(mockStructureDefinitionModel, 'findOne');

      await service.update(id, updateDto);

      expect(findOneSpy).not.toHaveBeenCalled();
      expect(existingStructureDefinition.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when new URL already exists', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateStructureDefinitionDto = {
        url: 'http://hl7.org/fhir/StructureDefinition/ExistingURL'
      };

      const existingStructureDefinition = {
        ...mockStructureDefinition,
        url: 'http://hl7.org/fhir/StructureDefinition/OldURL'
      };

      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingStructureDefinition)
      });

      // Mock URL already exists
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'other-id' })
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(
        new BadRequestException('StructureDefinition with URL \'http://hl7.org/fhir/StructureDefinition/ExistingURL\' already exists')
      );
    });

    it('should throw NotFoundException when structure definition to update not found', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateStructureDefinitionDto = {
        definition: { kind: 'resource' }
      };

      mockStructureDefinitionModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(
        new NotFoundException('StructureDefinition not found')
      );
    });
  });

  describe('delete', () => {
    it('should delete structure definition successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      
      mockStructureDefinitionModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      await service.delete(id);

      expect(mockStructureDefinitionModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when structure definition to delete not found', async () => {
      const id = '507f1f77bcf86cd799439012';
      
      mockStructureDefinitionModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.delete(id)).rejects.toThrow(
        new NotFoundException('StructureDefinition not found')
      );
    });
  });

  describe('validateUrlUniqueness', () => {
    it('should pass validation when URL is unique', async () => {
      const url = 'http://hl7.org/fhir/StructureDefinition/UniqueURL';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service['validateUrlUniqueness'](url)).resolves.not.toThrow();
      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({ url });
    });

    it('should pass validation when URL exists but is excluded', async () => {
      const url = 'http://hl7.org/fhir/StructureDefinition/ExistingURL';
      const excludeId = '507f1f77bcf86cd799439011';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service['validateUrlUniqueness'](url, excludeId)).resolves.not.toThrow();
      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({
        url,
        _id: { $ne: excludeId }
      });
    });

    it('should throw BadRequestException when URL already exists', async () => {
      const url = 'http://hl7.org/fhir/StructureDefinition/ExistingURL';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      await expect(service['validateUrlUniqueness'](url)).rejects.toThrow(
        new BadRequestException(`StructureDefinition with URL '${url}' already exists`)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty filter in findAll', async () => {
      const mockResults = [mockStructureDefinition];
      
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll({});

      expect(mockStructureDefinitionModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResults);
    });

    it('should handle complex filter objects in findAll', async () => {
      const complexFilter = {
        resourceType: 'StructureDefinition',
        release: { $gte: 4 },
        'definition.kind': 'resource'
      };
      const mockResults = [mockStructureDefinition];
      
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const result = await service.findAll(complexFilter);

      expect(mockStructureDefinitionModel.find).toHaveBeenCalledWith(complexFilter);
      expect(result).toEqual(mockResults);
    });

    it('should handle database connection errors', async () => {
      mockStructureDefinitionModel.find = jest.fn().mockReturnValue({
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
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd799439011z' // invalid character
      ];

      for (const id of edgeCaseIds) {
        await expect(service.findOne(id)).rejects.toThrow(BadRequestException);
      }
    });

    it('should handle URL with special characters', async () => {
      const specialUrl = 'http://example.com/fhir/StructureDefinition/Special%20Characters&Test';
      
      mockStructureDefinitionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStructureDefinition)
      });

      const result = await service.findByUrl(specialUrl);

      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({
        url: { $eq: specialUrl }
      });
      expect(result).toEqual(mockStructureDefinition);
    });
  });
});