import {Test, TestingModule} from '@nestjs/testing';
import {getModelToken} from '@nestjs/mongoose';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {Model, Types} from 'mongoose';
import {SearchParameterService} from './search-parameter.service';
import {
    SearchParameterDocument,
    SearchParameterSchema,
    SearchParameterStatus,
    SearchParameterType
} from '../../schema/search-parameter.schema';
import {CreateSearchParameterDto} from '../../dto/create-search-parameter-dto';
import {UpdateSearchParameterDto} from '../../dto/update-search-parameter-dto';

describe('SearchParameterService', () => {
    let service: SearchParameterService;
    let mockModel: jest.Mocked<Model<SearchParameterDocument>>;

    const mockSearchParameterId = '507f1f77bcf86cd799439011';
    const mockSearchParameter = {
        _id: mockSearchParameterId,
        resourceType: 'SearchParameter',
        url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
        name: 'name',
        status: SearchParameterStatus.ACTIVE,
        code: 'name',
        base: ['Patient'],
        type: SearchParameterType.STRING,
        description: 'A server defined search that may match any of the string fields in the HumanName',
        expression: 'Patient.name',
        date: new Date('2023-01-01T00:00:00.000Z'),
        meta: {
            versionId: '1',
            lastUpdated: new Date('2023-01-01T00:00:00.000Z')
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
            findOne: jest.fn(() => ({exec: jest.fn()})),
            findById: jest.fn(() => ({exec: jest.fn()})),
            findByIdAndDelete: jest.fn(() => ({exec: jest.fn()})),
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
                SearchParameterService,
                {
                    provide: getModelToken(SearchParameterSchema.name),
                    useValue: mockModel
                }
            ]
        }).compile();

        service = module.get<SearchParameterService>(SearchParameterService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createDto: CreateSearchParameterDto = {
            resourceType: 'SearchParameter',
            url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
            name: 'name',
            status: SearchParameterStatus.ACTIVE,
            code: 'name',
            base: ['Patient'],
            type: SearchParameterType.STRING,
            description: 'Test search parameter'
        };

        it('should create a new SearchParameter', async () => {
            const mockSavedParameter = {...mockSearchParameter};
            const mockInstance = {
                save: jest.fn().mockResolvedValue(mockSavedParameter)
            };

            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            // Mock the model constructor to return our specific instance
            (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

            const result = await service.create(createDto);

            expect(mockModel.findOne).toHaveBeenCalledWith({url: createDto.url});
            expect(mockModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...createDto,
                    date: expect.any(Date),
                    meta: {
                        versionId: '1',
                        lastUpdated: expect.any(Date)
                    }
                })
            );
            expect(mockInstance.save).toHaveBeenCalled();
            expect(result).toEqual(mockSavedParameter);
        });

        it('should create with provided date', async () => {
            const createDtoWithDate = {
                ...createDto,
                date: '2023-06-01T00:00:00.000Z'
            };

            const mockSavedParameter = {...mockSearchParameter};
            const mockInstance = {
                save: jest.fn().mockResolvedValue(mockSavedParameter)
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
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(createDto)).rejects.toThrow("SearchParameter with URL 'http://hl7.org/fhir/SearchParameter/Patient-name' already exists");
        });

        it('should throw BadRequestException for invalid base resource types', async () => {
            const invalidCreateDto = {
                ...createDto,
                base: ['InvalidResource']
            };

            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await expect(service.create(invalidCreateDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(invalidCreateDto)).rejects.toThrow('Invalid resource types: InvalidResource');
        });

        it('should accept valid FHIR resource types', async () => {
            const validCreateDto = {
                ...createDto,
                base: ['Patient', 'Practitioner', 'Organization']
            };

            const mockSavedParameter = {...mockSearchParameter};
            const mockInstance = {
                save: jest.fn().mockResolvedValue(mockSavedParameter)
            };

            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

            const result = await service.create(validCreateDto);

            expect(result).toEqual(mockSavedParameter);
        });
    });

    describe('findAll', () => {
        it('should return all SearchParameters without filter', async () => {
            const mockResults = [mockSearchParameter];
            mockQuery.exec.mockResolvedValue(mockResults);

            const result = await service.findAll();

            expect(mockModel.find).toHaveBeenCalledWith({});
            expect(mockQuery.sort).toHaveBeenCalledWith({name: 1});
            expect(result).toEqual(mockResults);
        });

        it('should return SearchParameters with filter', async () => {
            const mockResults = [mockSearchParameter];
            const filter = {status: SearchParameterStatus.ACTIVE};
            mockQuery.exec.mockResolvedValue(mockResults);

            const result = await service.findAll(filter);

            expect(mockModel.find).toHaveBeenCalledWith(filter);
            expect(mockQuery.sort).toHaveBeenCalledWith({name: 1});
            expect(result).toEqual(mockResults);
        });

        it('should return empty array when no results found', async () => {
            mockQuery.exec.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findByResourceType', () => {
        it('should return SearchParameters for specific resource type', async () => {
            const mockResults = [mockSearchParameter];
            mockQuery.exec.mockResolvedValue(mockResults);

            const result = await service.findByResourceType('Patient');

            expect(mockModel.find).toHaveBeenCalledWith({
                base: 'Patient',
                status: 'active'
            });
            expect(mockQuery.sort).toHaveBeenCalledWith({code: 1});
            expect(result).toEqual(mockResults);
        });

        it('should return empty array for non-existent resource type', async () => {
            mockQuery.exec.mockResolvedValue([]);

            const result = await service.findByResourceType('NonExistentResource');

            expect(result).toEqual([]);
        });
    });

    describe('findByUrl', () => {

        it('should return SearchParameter by URL', async () => {
            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            const result = await service.findByUrl('http://hl7.org/fhir/SearchParameter/Patient-name');

            expect(mockModel.findOne).toHaveBeenCalledWith({url: {"$eq": 'http://hl7.org/fhir/SearchParameter/Patient-name'}});
            expect(result).toEqual(mockSearchParameter);
        });

        it('should throw NotFoundException when SearchParameter not found by URL', async () => {
            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await expect(service.findByUrl('http://nonexistent.url')).rejects.toThrow(NotFoundException);
            await expect(service.findByUrl('http://nonexistent.url')).rejects.toThrow("SearchParameter with URL 'http://nonexistent.url' not found");
        });
    });

    describe('findOne', () => {
        it('should return SearchParameter by valid ID', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
            mockModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            const result = await service.findOne(mockSearchParameterId);

            expect(Types.ObjectId.isValid).toHaveBeenCalledWith(mockSearchParameterId);
            expect(mockModel.findById).toHaveBeenCalledWith(mockSearchParameterId);
            expect(result).toEqual(mockSearchParameter);
        });

        it('should throw BadRequestException for invalid ID', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false);

            await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
            await expect(service.findOne('invalid-id')).rejects.toThrow('Invalid SearchParameter ID');
        });

        it('should throw NotFoundException when SearchParameter not found by ID', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
            mockModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await expect(service.findOne(mockSearchParameterId)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(mockSearchParameterId)).rejects.toThrow('SearchParameter not found');
        });
    });

    describe('update', () => {
        const updateDto: UpdateSearchParameterDto = {
            description: 'Updated description',
            status: SearchParameterStatus.DRAFT
        };

        beforeEach(() => {
            jest.spyOn(service, 'findOne').mockResolvedValue(mockSearchParameter as any);
        });

        it('should update SearchParameter', async () => {
            const updatedSearchParameter = {...mockSearchParameter, ...updateDto};
            mockSearchParameter.save.mockResolvedValue(updatedSearchParameter);

            const result = await service.update(mockSearchParameterId, updateDto);

            expect(service.findOne).toHaveBeenCalledWith(mockSearchParameterId);
            expect(mockSearchParameter.save).toHaveBeenCalled();
            expect(result).toEqual(updatedSearchParameter);
        });

        it('should validate URL uniqueness when updating URL', async () => {
            const updateDtoWithUrl = {
                ...updateDto,
                url: 'http://hl7.org/fhir/SearchParameter/new-url'
            };

            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            mockSearchParameter.save.mockResolvedValue({...mockSearchParameter, ...updateDtoWithUrl});

            await service.update(mockSearchParameterId, updateDtoWithUrl);

            expect(mockModel.findOne).toHaveBeenCalledWith({url: updateDtoWithUrl.url});
        });

        it('should throw BadRequestException when updating to existing URL', async () => {
            const updateDtoWithUrl = {
                ...updateDto,
                url: 'http://hl7.org/fhir/SearchParameter/existing-url'
            };

            const existingSearchParameter = {
                ...mockSearchParameter,
                url: 'http://hl7.org/fhir/SearchParameter/existing-url'
            };
            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(existingSearchParameter)
            });

            await expect(service.update(mockSearchParameterId, updateDtoWithUrl)).rejects.toThrow(BadRequestException);
            await expect(service.update(mockSearchParameterId, updateDtoWithUrl)).rejects.toThrow("SearchParameter with URL 'http://hl7.org/fhir/SearchParameter/existing-url' already exists");
        });

        it('should not validate URL uniqueness when URL is unchanged', async () => {
            const updateDtoWithSameUrl = {
                ...updateDto,
                url: mockSearchParameter.url
            };

            mockSearchParameter.save.mockResolvedValue({...mockSearchParameter, ...updateDto});

            await service.update(mockSearchParameterId, updateDtoWithSameUrl);

            expect(mockModel.findOne).not.toHaveBeenCalled();
        });

        it('should validate base resource types when updating base', async () => {
            const updateDtoWithInvalidBase = {
                ...updateDto,
                base: ['InvalidResource']
            };

            await expect(service.update(mockSearchParameterId, updateDtoWithInvalidBase)).rejects.toThrow(BadRequestException);
            await expect(service.update(mockSearchParameterId, updateDtoWithInvalidBase)).rejects.toThrow('Invalid resource types: InvalidResource');
        });

        it('should update date field correctly', async () => {
            const updateDtoWithDate = {
                ...updateDto,
                date: '2023-12-01T00:00:00.000Z'
            };

            mockSearchParameter.save.mockResolvedValue({...mockSearchParameter, ...updateDtoWithDate});

            await service.update(mockSearchParameterId, updateDtoWithDate);

            expect(mockSearchParameter.date).toEqual(new Date('2023-12-01T00:00:00.000Z'));
        });

        it('should throw NotFoundException when SearchParameter to update not found', async () => {
            jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('SearchParameter not found'));

            await expect(service.update(mockSearchParameterId, updateDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete SearchParameter', async () => {
            mockModel.findByIdAndDelete = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            await service.delete(mockSearchParameterId);

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockSearchParameterId);
        });

        it('should throw NotFoundException when SearchParameter to delete not found', async () => {
            mockModel.findByIdAndDelete = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await expect(service.delete(mockSearchParameterId)).rejects.toThrow(NotFoundException);
            await expect(service.delete(mockSearchParameterId)).rejects.toThrow('SearchParameter not found');
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
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            await expect((service as any).validateUrlUniqueness('http://duplicate.url')).rejects.toThrow(BadRequestException);
            await expect((service as any).validateUrlUniqueness('http://duplicate.url')).rejects.toThrow("SearchParameter with URL 'http://duplicate.url' already exists");
        });

        it('should exclude specified ID from uniqueness check', async () => {
            const excludeId = '507f1f77bcf86cd799439012';
            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await (service as any).validateUrlUniqueness('http://test.url', excludeId);

            expect(mockModel.findOne).toHaveBeenCalledWith({
                url: 'http://test.url',
                _id: {$ne: excludeId}
            });
        });
    });

    describe('validateBaseResourceTypes (private method)', () => {
        it('should not throw error for valid FHIR resource types', () => {
            const validTypes = ['Patient', 'Practitioner', 'Organization', 'Observation'];

            expect(() => (service as any).validateBaseResourceTypes(validTypes)).not.toThrow();
        });

        it('should throw BadRequestException for invalid resource types', () => {
            const invalidTypes = ['InvalidResource', 'AnotherInvalid'];

            expect(() => (service as any).validateBaseResourceTypes(invalidTypes)).toThrow(BadRequestException);
            expect(() => (service as any).validateBaseResourceTypes(invalidTypes)).toThrow('Invalid resource types: InvalidResource, AnotherInvalid');
        });

        it('should throw BadRequestException for mixed valid and invalid types', () => {
            const mixedTypes = ['Patient', 'InvalidResource', 'Practitioner'];

            expect(() => (service as any).validateBaseResourceTypes(mixedTypes)).toThrow(BadRequestException);
            expect(() => (service as any).validateBaseResourceTypes(mixedTypes)).toThrow('Invalid resource types: InvalidResource');
        });

        it('should handle empty array', () => {
            expect(() => (service as any).validateBaseResourceTypes([])).not.toThrow();
        });

        it('should validate all FHIR R4 resource types', () => {
            const allValidTypes = [
                'Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment',
                'Patient', 'Practitioner', 'Organization', 'Observation', 'Bundle'
            ];

            expect(() => (service as any).validateBaseResourceTypes(allValidTypes)).not.toThrow();
        });
    });

    describe('constructor', () => {
        it('should create service with model dependency', () => {
            expect(service).toBeDefined();
            expect((service as any).searchParameterModel).toBe(mockModel);
        });
    });

    describe('integration scenarios', () => {
        it('should handle full CRUD lifecycle', async () => {
            const createDto: CreateSearchParameterDto = {
                resourceType: 'SearchParameter',
                url: 'http://test.com/SearchParameter/test',
                name: 'test',
                status: SearchParameterStatus.ACTIVE,
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                description: 'Test search parameter'
            };

            const updateDto: UpdateSearchParameterDto = {
                description: 'Updated test search parameter',
                status: SearchParameterStatus.DRAFT
            };

            // Create
            const mockInstance = {
                save: jest.fn().mockResolvedValue(mockSearchParameter)
            };
            mockModel.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            (mockModel as unknown as jest.Mock).mockImplementation(() => mockInstance);

            const created = await service.create(createDto);
            expect(created).toBeDefined();

            // Read
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
            mockModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            const found = await service.findOne(mockSearchParameterId);
            expect(found).toEqual(mockSearchParameter);

            // Update
            jest.spyOn(service, 'findOne').mockResolvedValue(mockSearchParameter as any);
            const updatedSearchParameter = {...mockSearchParameter, ...updateDto};
            mockSearchParameter.save.mockResolvedValue(updatedSearchParameter);

            const updated = await service.update(mockSearchParameterId, updateDto);
            expect(updated).toEqual(updatedSearchParameter);

            // Delete
            mockModel.findByIdAndDelete = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockSearchParameter)
            });

            await service.delete(mockSearchParameterId);
            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockSearchParameterId);
        });

        it('should handle complex search scenarios', async () => {
            const mockResults = [
                {...mockSearchParameter, base: ['Patient'], status: SearchParameterStatus.ACTIVE},
                {...mockSearchParameter, base: ['Practitioner'], status: SearchParameterStatus.ACTIVE}
            ];

            mockQuery.exec.mockResolvedValue(mockResults);

            // Test findAll with complex filter
            const complexFilter = {
                status: SearchParameterStatus.ACTIVE,
                base: {$in: ['Patient', 'Practitioner']}
            };
            const result = await service.findAll(complexFilter);

            expect(mockModel.find).toHaveBeenCalledWith(complexFilter);
            expect(result).toEqual(mockResults);

            // Test findByResourceType
            mockQuery.exec.mockResolvedValue([mockResults[0]]);
            const patientParams = await service.findByResourceType('Patient');

            expect(mockModel.find).toHaveBeenCalledWith({
                base: 'Patient',
                status: 'active'
            });
            expect(patientParams).toEqual([mockResults[0]]);
        });
    });
});