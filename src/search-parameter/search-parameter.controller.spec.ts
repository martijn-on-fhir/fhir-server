import {Test, TestingModule} from '@nestjs/testing';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {SearchParameterController} from './search-parameter.controller';
import {SearchParameterService} from '../services/search-parameter/search-parameter.service';
import {AuthorizerGuard} from '../guards/authorizer/authorizer.guard';
import {CreateSearchParameterDto} from '../dto/create-search-parameter-dto';
import {UpdateSearchParameterDto} from '../dto/update-search-parameter-dto';
import {SearchParameterStatus, SearchParameterType} from '../schema/search-parameter.schema';

describe('SearchParameterController', () => {
    let controller: SearchParameterController;
    let mockSearchParameterService: jest.Mocked<SearchParameterService>;

    const mockSearchParameter = {
        _id: '507f1f77bcf86cd799439011',
        resourceType: 'SearchParameter',
        url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
        name: 'name',
        status: SearchParameterStatus.ACTIVE,
        code: 'name',
        base: ['Patient'],
        type: SearchParameterType.STRING,
        description: 'A server defined search that may match any of the string fields in the HumanName',
        expression: 'Patient.name',
        meta: {
            versionId: '1',
            lastUpdated: new Date('2023-01-01T00:00:00.000Z')
        },
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
    };

    beforeEach(async () => {
        mockSearchParameterService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findByResourceType: jest.fn(),
            findByUrl: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        } as any;

        const mockConfigService = {
            get: jest.fn().mockReturnValue('test-value')
        };

        const mockAuthorizerGuard = {
            canActivate: jest.fn().mockReturnValue(true)
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SearchParameterController],
            providers: [
                {
                    provide: SearchParameterService,
                    useValue: mockSearchParameterService
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                },
                {
                    provide: AuthorizerGuard,
                    useValue: mockAuthorizerGuard
                }
            ]
        }).compile();

        controller = module.get<SearchParameterController>(SearchParameterController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new SearchParameter', async () => {
            const createDto: CreateSearchParameterDto = {
                resourceType: 'SearchParameter',
                url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                name: 'name',
                status: SearchParameterStatus.ACTIVE,
                code: 'name',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                description: 'A server defined search that may match any of the string fields in the HumanName',
                expression: 'Patient.name'
            };

            mockSearchParameterService.create.mockResolvedValue(mockSearchParameter as any);

            const result = await controller.create(createDto);

            expect(mockSearchParameterService.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockSearchParameter);
        });

        it('should handle service errors during creation', async () => {
            const createDto: CreateSearchParameterDto = {
                resourceType: 'SearchParameter',
                url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                name: 'name',
                status: SearchParameterStatus.ACTIVE,
                code: 'name',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                description: 'Test description'
            };

            mockSearchParameterService.create.mockRejectedValue(new BadRequestException('URL already exists'));

            await expect(controller.create(createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return all SearchParameters without filters', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll();

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockResults);
        });

        it('should filter by status', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(SearchParameterStatus.ACTIVE);

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                status: SearchParameterStatus.ACTIVE
            });
            expect(result).toEqual(mockResults);
        });

        it('should filter by base resource type', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(undefined, 'Patient');

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                base: 'Patient'
            });
            expect(result).toEqual(mockResults);
        });

        it('should filter by code with regex', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(undefined, undefined, 'name');

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                code: expect.any(RegExp)
            });
            expect(result).toEqual(mockResults);
        });

        it('should escape regex characters in code filter', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            await controller.findAll(undefined, undefined, 'test.*special');

            const expectedFilter = {code: expect.any(RegExp)};
            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith(expectedFilter);

            const actualCall = mockSearchParameterService.findAll.mock.calls[0][0];
            expect(actualCall.code.source).toBe('test\\.\\*special');
        });

        it('should filter by type', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(undefined, undefined, undefined, SearchParameterType.STRING);

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                type: SearchParameterType.STRING
            });
            expect(result).toEqual(mockResults);
        });

        it('should combine multiple filters', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(
                SearchParameterStatus.ACTIVE,
                'Patient',
                'name',
                SearchParameterType.STRING
            );

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                status: SearchParameterStatus.ACTIVE,
                base: 'Patient',
                code: expect.any(RegExp),
                type: SearchParameterType.STRING
            });
            expect(result).toEqual(mockResults);
        });

        it('should ignore invalid status values', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll('invalid-status' as any);

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockResults);
        });

        it('should ignore invalid type values', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findAll.mockResolvedValue(mockResults as any);

            const result = await controller.findAll(undefined, undefined, undefined, 'invalid-type' as any);

            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockResults);
        });
    });

    describe('findByResourceType', () => {
        it('should return SearchParameters for a specific resource type', async () => {
            const mockResults = [mockSearchParameter];
            mockSearchParameterService.findByResourceType.mockResolvedValue(mockResults as any);

            const result = await controller.findByResourceType('Patient');

            expect(mockSearchParameterService.findByResourceType).toHaveBeenCalledWith('Patient');
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results for resource type', async () => {
            mockSearchParameterService.findByResourceType.mockResolvedValue([]);

            const result = await controller.findByResourceType('NonExistentResource');

            expect(mockSearchParameterService.findByResourceType).toHaveBeenCalledWith('NonExistentResource');
            expect(result).toEqual([]);
        });
    });

    describe('findByUrl', () => {
        it('should return SearchParameter by URL', async () => {
            mockSearchParameterService.findByUrl.mockResolvedValue(mockSearchParameter as any);

            const result = await controller.findByUrl('http://hl7.org/fhir/SearchParameter/Patient-name');

            expect(mockSearchParameterService.findByUrl).toHaveBeenCalledWith('http://hl7.org/fhir/SearchParameter/Patient-name');
            expect(result).toEqual(mockSearchParameter);
        });

        it('should handle not found error for URL', async () => {
            mockSearchParameterService.findByUrl.mockRejectedValue(new NotFoundException('SearchParameter not found'));

            await expect(controller.findByUrl('http://nonexistent.url')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        it('should return SearchParameter by ID', async () => {
            mockSearchParameterService.findOne.mockResolvedValue(mockSearchParameter as any);

            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(mockSearchParameterService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(result).toEqual(mockSearchParameter);
        });

        it('should handle invalid ID format', async () => {
            mockSearchParameterService.findOne.mockRejectedValue(new BadRequestException('Invalid SearchParameter ID'));

            await expect(controller.findOne('invalid-id')).rejects.toThrow(BadRequestException);
        });

        it('should handle not found error for ID', async () => {
            mockSearchParameterService.findOne.mockRejectedValue(new NotFoundException('SearchParameter not found'));

            await expect(controller.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update SearchParameter', async () => {
            const updateDto: UpdateSearchParameterDto = {
                description: 'Updated description',
                status: SearchParameterStatus.DRAFT
            };
            const updatedSearchParameter = {...mockSearchParameter, ...updateDto};

            mockSearchParameterService.update.mockResolvedValue(updatedSearchParameter as any);

            const result = await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockSearchParameterService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
            expect(result).toEqual(updatedSearchParameter);
        });

        it('should handle not found error during update', async () => {
            const updateDto: UpdateSearchParameterDto = {
                description: 'Updated description'
            };

            mockSearchParameterService.update.mockRejectedValue(new NotFoundException('SearchParameter not found'));

            await expect(controller.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow(NotFoundException);
        });

        it('should handle URL uniqueness validation during update', async () => {
            const updateDto: UpdateSearchParameterDto = {
                url: 'http://hl7.org/fhir/SearchParameter/existing-url'
            };

            mockSearchParameterService.update.mockRejectedValue(
                new BadRequestException('SearchParameter with URL already exists')
            );

            await expect(controller.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        it('should delete SearchParameter', async () => {
            mockSearchParameterService.delete.mockResolvedValue();

            await controller.remove('507f1f77bcf86cd799439011');

            expect(mockSearchParameterService.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });

        it('should handle not found error during deletion', async () => {
            mockSearchParameterService.delete.mockRejectedValue(new NotFoundException('SearchParameter not found'));

            await expect(controller.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
        });
    });

    describe('private validation methods', () => {
        it('should validate SearchParameterStatus correctly', () => {
            expect((controller as any).isValidSearchParameterStatus('active')).toBe(true);
            expect((controller as any).isValidSearchParameterStatus('draft')).toBe(true);
            expect((controller as any).isValidSearchParameterStatus('retired')).toBe(true);
            expect((controller as any).isValidSearchParameterStatus('unknown')).toBe(true);
            expect((controller as any).isValidSearchParameterStatus('invalid')).toBe(false);
            expect((controller as any).isValidSearchParameterStatus('')).toBe(false);
        });

        it('should validate SearchParameterType correctly', () => {
            expect((controller as any).isValidSearchParameterType('string')).toBe(true);
            expect((controller as any).isValidSearchParameterType('number')).toBe(true);
            expect((controller as any).isValidSearchParameterType('date')).toBe(true);
            expect((controller as any).isValidSearchParameterType('token')).toBe(true);
            expect((controller as any).isValidSearchParameterType('reference')).toBe(true);
            expect((controller as any).isValidSearchParameterType('composite')).toBe(true);
            expect((controller as any).isValidSearchParameterType('quantity')).toBe(true);
            expect((controller as any).isValidSearchParameterType('uri')).toBe(true);
            expect((controller as any).isValidSearchParameterType('special')).toBe(true);
            expect((controller as any).isValidSearchParameterType('invalid')).toBe(false);
            expect((controller as any).isValidSearchParameterType('')).toBe(false);
        });

        it('should escape regex characters correctly', () => {
            expect((controller as any).escapeRegexCharacters('test')).toBe('test');
            expect((controller as any).escapeRegexCharacters('test.*special')).toBe('test\\.\\*special');
            expect((controller as any).escapeRegexCharacters('test+?^${}()|[]\\special')).toBe('test\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\special');
            expect((controller as any).escapeRegexCharacters('')).toBe('');
        });
    });

    describe('constructor', () => {
        it('should create controller with SearchParameterService dependency', () => {
            expect(controller).toBeDefined();
            expect((controller as any).searchParameterService).toBe(mockSearchParameterService);
        });
    });

    describe('integration scenarios', () => {
        it('should handle complex search with multiple parameters', async () => {
            const complexMockData = [
                {...mockSearchParameter, code: 'family', type: SearchParameterType.STRING},
                {...mockSearchParameter, code: 'given', type: SearchParameterType.STRING},
                {...mockSearchParameter, code: 'birthdate', type: SearchParameterType.DATE}
            ];

            mockSearchParameterService.findAll.mockResolvedValue(complexMockData as any);

            const result = await controller.findAll(
                SearchParameterStatus.ACTIVE,
                'Patient',
                'name',
                SearchParameterType.STRING
            );

            expect(result).toEqual(complexMockData);
            expect(mockSearchParameterService.findAll).toHaveBeenCalledWith({
                status: SearchParameterStatus.ACTIVE,
                base: 'Patient',
                code: expect.any(RegExp),
                type: SearchParameterType.STRING
            });
        });

        it('should handle service method chain for CRUD operations', async () => {
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
                description: 'Updated test search parameter'
            };

            const createdSearchParameter = {...mockSearchParameter, ...createDto};
            const updatedSearchParameter = {...createdSearchParameter, ...updateDto};

            mockSearchParameterService.create.mockResolvedValue(createdSearchParameter as any);
            mockSearchParameterService.findOne.mockResolvedValue(createdSearchParameter as any);
            mockSearchParameterService.update.mockResolvedValue(updatedSearchParameter as any);
            mockSearchParameterService.delete.mockResolvedValue();

            // Create
            const created = await controller.create(createDto);
            expect(created).toEqual(createdSearchParameter);

            // Read
            const found = await controller.findOne('507f1f77bcf86cd799439011');
            expect(found).toEqual(createdSearchParameter);

            // Update
            const updated = await controller.update('507f1f77bcf86cd799439011', updateDto);
            expect(updated).toEqual(updatedSearchParameter);

            // Delete
            await controller.remove('507f1f77bcf86cd799439011');

            expect(mockSearchParameterService.create).toHaveBeenCalledTimes(1);
            expect(mockSearchParameterService.findOne).toHaveBeenCalledTimes(1);
            expect(mockSearchParameterService.update).toHaveBeenCalledTimes(1);
            expect(mockSearchParameterService.delete).toHaveBeenCalledTimes(1);
        });
    });
});