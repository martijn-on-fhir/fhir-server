import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ValueSetService } from './value-set.service';
import { ValueSetDocument, ValueSetSchema, ValueSetStatus } from '../../schema/value-set.schema';
import { CreateValueSetDto } from '../../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../../dto/update-value-set-dto';

/**
 * Tests ValueSetService business logic for FHIR ValueSet resources
 * Covers CRUD operations, URL uniqueness validation, status validation, code validation, and expansion
 */
describe('ValueSetService', () => {
  let service: ValueSetService;
  let mockModel: jest.Mocked<Model<ValueSetDocument>>;

  const mockValueSetId = '123e4567-e89b-12d3-a456-426614174000';
  const mockValueSet = {
    _id: mockValueSetId,
    id: mockValueSetId,
    resourceType: 'ValueSet',
    url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
    name: 'AdministrativeGender',
    title: 'Administrative Gender',
    status: ValueSetStatus.ACTIVE,
    description: 'The gender of a person used for administrative purposes',
    date: new Date('2023-01-01T00:00:00.000Z'),
    meta: {
      versionId: '1',
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    },
    compose: {
      include: [{
        system: 'http://hl7.org/fhir/administrative-gender',
        concept: [
          { code: 'male', display: 'Male' },
          { code: 'female', display: 'Female' }
        ]
      }]
    },
    save: jest.fn(),
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z')
  };

  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn()
  };

  beforeEach(async () => {
    mockModel = {
      find: jest.fn(() => mockQuery),
      findOne: jest.fn(() => ({ exec: jest.fn() })),
      findOneAndDelete: jest.fn(() => ({ exec: jest.fn() })),
      create: jest.fn(),
      save: jest.fn(),
      exec: jest.fn()
    } as any;

    // Make mockModel a constructor function
    const mockModelConstructor = jest.fn().mockImplementation(() => ({
      save: jest.fn()
    }));

    Object.assign(mockModelConstructor, mockModel);
    mockModel = mockModelConstructor as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValueSetService,
        {
          provide: getModelToken(ValueSetSchema.name),
          useValue: mockModel
        }
      ]
    }).compile();

    service = module.get<ValueSetService>(ValueSetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
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

    it('should create a new ValueSet', async () => {
      const mockSavedValueSet = { ...mockValueSet };
      const mockInstance = {
        save: jest.fn().mockResolvedValue(mockSavedValueSet)
      };

      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

      const result = await service.create(createDto);

      expect(mockModel.findOne).toHaveBeenCalledWith({ url: createDto.url });
      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          id: expect.any(String),
          date: expect.any(Date),
          meta: {
            versionId: '1',
            lastUpdated: expect.any(Date)
          },
          resourceType: 'ValueSet'
        })
      );
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedValueSet);
    });

    it('should create with provided date', async () => {
      const createDtoWithDate = {
        ...createDto,
        date: '2023-06-01T00:00:00.000Z'
      };

      const mockSavedValueSet = { ...mockValueSet };
      const mockInstance = {
        save: jest.fn().mockResolvedValue(mockSavedValueSet)
      };

      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

      await service.create(createDtoWithDate);

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({
          date: new Date('2023-06-01T00:00:00.000Z')
        })
      );
    });

    it('should throw BadRequestException if URL already exists', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow("ValueSet with URL 'http://hl7.org/fhir/ValueSet/administrative-gender' already exists");
    });

    it('should throw BadRequestException for invalid status', async () => {
      const invalidCreateDto = {
        ...createDto,
        status: 'invalid-status' as ValueSetStatus
      };

      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.create(invalidCreateDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidCreateDto)).rejects.toThrow('Invalid status: invalid-status');
    });

    it('should accept valid FHIR ValueSet statuses', async () => {
      const validStatuses = [ValueSetStatus.ACTIVE, ValueSetStatus.DRAFT, ValueSetStatus.RETIRED, ValueSetStatus.UNKNOWN];
      
      for (const status of validStatuses) {
        const validCreateDto = { ...createDto, status };

        const mockSavedValueSet = { ...mockValueSet };
        const mockInstance = {
          save: jest.fn().mockResolvedValue(mockSavedValueSet)
        };

        mockModel.findOne = jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        });

        (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

        const result = await service.create(validCreateDto);
        expect(result).toEqual(mockSavedValueSet);
      }
    });
  });

  describe('findAll', () => {
    it('should return all ValueSets without filter', async () => {
      const mockResults = [mockValueSet];
      mockQuery.exec.mockResolvedValue(mockResults);

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(mockResults);
    });

    it('should return ValueSets with filter', async () => {
      const mockResults = [mockValueSet];
      const filter = { status: ValueSetStatus.ACTIVE };
      mockQuery.exec.mockResolvedValue(mockResults);

      const result = await service.findAll(filter);

      expect(mockModel.find).toHaveBeenCalledWith(filter);
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no results found', async () => {
      mockQuery.exec.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should return ValueSets for specific status', async () => {
      const mockResults = [mockValueSet];
      mockQuery.exec.mockResolvedValue(mockResults);

      const result = await service.findByStatus(ValueSetStatus.ACTIVE);

      expect(mockModel.find).toHaveBeenCalledWith({ status: ValueSetStatus.ACTIVE });
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(mockResults);
    });

    it('should return empty array for status with no ValueSets', async () => {
      mockQuery.exec.mockResolvedValue([]);

      const result = await service.findByStatus(ValueSetStatus.RETIRED);

      expect(result).toEqual([]);
    });
  });

  describe('findByUrl', () => {
    it('should return ValueSet by URL', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const result = await service.findByUrl('http://hl7.org/fhir/ValueSet/administrative-gender');

      expect(mockModel.findOne).toHaveBeenCalledWith({ url: { "$eq": 'http://hl7.org/fhir/ValueSet/administrative-gender' } });
      expect(result).toEqual(mockValueSet);
    });

    it('should throw NotFoundException when ValueSet not found by URL', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findByUrl('http://nonexistent.url')).rejects.toThrow(NotFoundException);
      await expect(service.findByUrl('http://nonexistent.url')).rejects.toThrow("ValueSet with URL 'http://nonexistent.url' not found");
    });
  });

  describe('findOne', () => {
    it('should return ValueSet by valid ID', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const result = await service.findOne(mockValueSetId);

      expect(mockModel.findOne).toHaveBeenCalledWith({ id: mockValueSetId }, {_id: 0});
      expect(result).toEqual(mockValueSet);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findOne('')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('')).rejects.toThrow('Invalid ValueSet ID');
    });

    it('should throw NotFoundException when ValueSet not found by ID', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne(mockValueSetId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockValueSetId)).rejects.toThrow('ValueSet not found');
    });
  });

  describe('update', () => {
    const updateDto: UpdateValueSetDto = {
      description: 'Updated description',
      status: ValueSetStatus.DRAFT
    };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockValueSet as any);
    });

    it('should update ValueSet', async () => {
      const updatedValueSet = { ...mockValueSet, ...updateDto };
      mockValueSet.save.mockResolvedValue(updatedValueSet);

      const result = await service.update(mockValueSetId, updateDto);

      expect(service.findOne).toHaveBeenCalledWith(mockValueSetId);
      expect(mockValueSet.save).toHaveBeenCalled();
      expect(result).toEqual(updatedValueSet);
    });

    it('should validate URL uniqueness when updating URL', async () => {
      const updateDtoWithUrl = {
        ...updateDto,
        url: 'http://hl7.org/fhir/ValueSet/new-url'
      };

      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      mockValueSet.save.mockResolvedValue({ ...mockValueSet, ...updateDtoWithUrl });

      await service.update(mockValueSetId, updateDtoWithUrl);

      expect(mockModel.findOne).toHaveBeenCalledWith({ url: updateDtoWithUrl.url });
    });

    it('should throw BadRequestException when updating to existing URL', async () => {
      const updateDtoWithUrl = {
        ...updateDto,
        url: 'http://hl7.org/fhir/ValueSet/existing-url'
      };

      const existingValueSet = {
        ...mockValueSet,
        url: 'http://hl7.org/fhir/ValueSet/existing-url'
      };
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingValueSet)
      });

      await expect(service.update(mockValueSetId, updateDtoWithUrl)).rejects.toThrow(BadRequestException);
      await expect(service.update(mockValueSetId, updateDtoWithUrl)).rejects.toThrow("ValueSet with URL 'http://hl7.org/fhir/ValueSet/existing-url' already exists");
    });

    it('should not validate URL uniqueness when URL is unchanged', async () => {
      const updateDtoWithSameUrl = {
        ...updateDto,
        url: mockValueSet.url
      };

      mockValueSet.save.mockResolvedValue({ ...mockValueSet, ...updateDto });

      await service.update(mockValueSetId, updateDtoWithSameUrl);

      expect(mockModel.findOne).not.toHaveBeenCalled();
    });

    it('should validate status when updating status', async () => {
      const updateDtoWithInvalidStatus = {
        ...updateDto,
        status: 'invalid-status' as ValueSetStatus
      };

      await expect(service.update(mockValueSetId, updateDtoWithInvalidStatus)).rejects.toThrow(BadRequestException);
      await expect(service.update(mockValueSetId, updateDtoWithInvalidStatus)).rejects.toThrow('Invalid status: invalid-status');
    });

    it('should update date field correctly', async () => {
      const updateDtoWithDate = {
        ...updateDto,
        date: '2023-12-01T00:00:00.000Z'
      };

      mockValueSet.save.mockResolvedValue({ ...mockValueSet, ...updateDtoWithDate });

      await service.update(mockValueSetId, updateDtoWithDate);

      expect(mockValueSet.date).toEqual(new Date('2023-12-01T00:00:00.000Z'));
    });

    it('should update meta information', async () => {
      // Reset versionId for this test
      mockValueSet.meta.versionId = '1';
      mockValueSet.save.mockResolvedValue({ ...mockValueSet, ...updateDto });

      await service.update(mockValueSetId, updateDto);

      expect(mockValueSet.meta.lastUpdated).toBeInstanceOf(Date);
      expect(mockValueSet.meta.versionId).toBe('2');
    });

    it('should throw NotFoundException when ValueSet to update not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('ValueSet not found'));

      await expect(service.update(mockValueSetId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete ValueSet', async () => {
      mockModel.findOneAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await service.delete(mockValueSetId);

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ id: mockValueSetId });
    });

    it('should throw NotFoundException when ValueSet to delete not found', async () => {
      mockModel.findOneAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.delete(mockValueSetId)).rejects.toThrow(NotFoundException);
      await expect(service.delete(mockValueSetId)).rejects.toThrow('ValueSet not found');
    });
  });

  /** Tests FHIR ValueSet $expand operation */
  describe('expand', () => {
    it('should return ValueSet with expansion', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockValueSet as any);

      const result = await service.expand(mockValueSetId);

      expect(service.findOne).toHaveBeenCalledWith(mockValueSetId);
      expect(result).toEqual(mockValueSet);
    });

    it('should create expansion if not exists', async () => {
      const valueSetWithoutExpansion = { ...mockValueSet, expansion: undefined };
      jest.spyOn(service, 'findOne').mockResolvedValue(valueSetWithoutExpansion as any);

      const result = await service.expand(mockValueSetId);

      expect(result.expansion).toBeDefined();
      expect(result.expansion?.timestamp).toBeInstanceOf(Date);
    });
  });

  /** Tests FHIR ValueSet $validate-code operation */
  describe('validateCode', () => {
    it('should return true for valid code in expansion', async () => {
      const valueSetWithExpansion = {
        ...mockValueSet,
        expansion: {
          timestamp: new Date(),
          contains: [
            { system: 'http://hl7.org/fhir/administrative-gender', code: 'male' }
          ]
        }
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(valueSetWithExpansion as any);

      const result = await service.validateCode(mockValueSetId, 'http://hl7.org/fhir/administrative-gender', 'male');

      expect(result).toBe(true);
    });

    it('should return true for valid code in compose', async () => {
      // Ensure mock doesn't have expansion to test compose path
      delete (mockValueSet as any).expansion;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockValueSet as any);

      const result = await service.validateCode(mockValueSetId, 'http://hl7.org/fhir/administrative-gender', 'male');

      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockValueSet as any);

      const result = await service.validateCode(mockValueSetId, 'http://hl7.org/fhir/administrative-gender', 'invalid');

      expect(result).toBe(false);
    });

    it('should return false for ValueSet without expansion or compose', async () => {
      const emptyValueSet = { ...mockValueSet, expansion: undefined, compose: undefined };
      jest.spyOn(service, 'findOne').mockResolvedValue(emptyValueSet as any);

      const result = await service.validateCode(mockValueSetId, 'http://hl7.org/fhir/administrative-gender', 'male');

      expect(result).toBe(false);
    });
  });

  describe('validateUrlUniqueness (private method)', () => {
    it('should not throw error for unique URL', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect((service as any).validateUrlUniqueness('http://unique.url')).resolves.not.toThrow();
    });

    it('should throw BadRequestException for duplicate URL', async () => {
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await expect((service as any).validateUrlUniqueness('http://duplicate.url')).rejects.toThrow(BadRequestException);
      await expect((service as any).validateUrlUniqueness('http://duplicate.url')).rejects.toThrow("ValueSet with URL 'http://duplicate.url' already exists");
    });

    it('should exclude specified ID from uniqueness check', async () => {
      const excludeId = '123e4567-e89b-12d3-a456-426614174001';
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await (service as any).validateUrlUniqueness('http://test.url', excludeId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        url: 'http://test.url',
        _id: { $ne: excludeId }
      });
    });
  });

  describe('validateStatus (private method)', () => {
    it('should not throw error for valid FHIR ValueSet statuses', () => {
      const validStatuses = Object.values(ValueSetStatus);

      validStatuses.forEach(status => {
        expect(() => (service as any).validateStatus(status)).not.toThrow();
      });
    });

    it('should throw BadRequestException for invalid status', () => {
      const invalidStatuses = ['invalid', 'published', 'superseded'];

      invalidStatuses.forEach(status => {
        expect(() => (service as any).validateStatus(status)).toThrow(BadRequestException);
        expect(() => (service as any).validateStatus(status)).toThrow(`Invalid status: ${status}`);
      });
    });
  });

  describe('constructor', () => {
    it('should create service with model dependency', () => {
      expect(service).toBeDefined();
      expect((service as any).valueSetModel).toBe(mockModel);
    });
  });

  /** Tests complete FHIR ValueSet workflows */
  describe('integration scenarios', () => {
    it('should handle full CRUD lifecycle', async () => {
      const createDto: CreateValueSetDto = {
        url: 'http://test.com/ValueSet/test',
        name: 'test',
        status: ValueSetStatus.ACTIVE,
        title: 'Test ValueSet',
        description: 'Test value set'
      };

      const updateDto: UpdateValueSetDto = {
        description: 'Updated test value set',
        status: ValueSetStatus.DRAFT
      };

      // Create
      const mockInstance = {
        save: jest.fn().mockResolvedValue(mockValueSet)
      };
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

      const created = await service.create(createDto);
      expect(created).toBeDefined();

      // Read
      mockModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      const found = await service.findOne(mockValueSetId);
      expect(found).toEqual(mockValueSet);

      // Update
      jest.spyOn(service, 'findOne').mockResolvedValue(mockValueSet as any);
      const updatedValueSet = { ...mockValueSet, ...updateDto };
      mockValueSet.save.mockResolvedValue(updatedValueSet);

      const updated = await service.update(mockValueSetId, updateDto);
      expect(updated).toEqual(updatedValueSet);

      // Delete
      mockModel.findOneAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockValueSet)
      });

      await service.delete(mockValueSetId);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ id: mockValueSetId });
    });

    it('should handle complex search scenarios', async () => {
      const mockResults = [
        { ...mockValueSet, status: ValueSetStatus.ACTIVE },
        { ...mockValueSet, status: ValueSetStatus.DRAFT }
      ];

      mockQuery.exec.mockResolvedValue(mockResults);

      // Test findAll with complex filter
      const complexFilter = {
        status: { $in: [ValueSetStatus.ACTIVE, ValueSetStatus.DRAFT] },
        name: { $regex: /gender/i }
      };
      const result = await service.findAll(complexFilter);

      expect(mockModel.find).toHaveBeenCalledWith(complexFilter);
      expect(result).toEqual(mockResults);

      // Test findByStatus
      mockQuery.exec.mockResolvedValue([mockResults[0]]);
      const activeValueSets = await service.findByStatus(ValueSetStatus.ACTIVE);

      expect(mockModel.find).toHaveBeenCalledWith({ status: ValueSetStatus.ACTIVE });
      expect(activeValueSets).toEqual([mockResults[0]]);
    });
  });
});