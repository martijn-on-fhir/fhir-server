import {Test, TestingModule} from '@nestjs/testing';
import {StructureDefinitionController} from './structure-definition.controller';
import {StructureDefinitionService} from '../services/structure-definition/structure-definition.service';
import {CreateStructureDefinitionDto} from '../dto/create-structure-definition-dto';
import {UpdateStructureDefinitionDto} from '../dto/update-structure-definition-dto';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AuthorizerGuard} from '../guards/authorizer/authorizer.guard';

describe('StructureDefinitionController', () => {
    let controller: StructureDefinitionController;
    let service: StructureDefinitionService;

    const mockStructureDefinitionService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findByUrl: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockStructureDefinition = {
        _id: '507f1f77bcf86cd799439011',
        resourceType: 'StructureDefinition',
        url: 'http://hl7.org/fhir/StructureDefinition/Patient',
        name: 'Patient',
        status: 'active',
        kind: 'resource',
        abstract: false,
        type: 'Patient',
        baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
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
            controllers: [StructureDefinitionController],
            providers: [
                {
                    provide: StructureDefinitionService,
                    useValue: mockStructureDefinitionService,
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

        controller = module.get<StructureDefinitionController>(StructureDefinitionController);
        service = module.get<StructureDefinitionService>(StructureDefinitionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a structure definition', async () => {
            const createDto: CreateStructureDefinitionDto = {
                resourceType: 'StructureDefinition',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                name: 'Patient',
                status: 'active',
                kind: 'resource',
                abstract: false,
                type: 'Patient',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                release: 4,
                definition: {
                    kind: 'resource',
                    abstract: false,
                    type: 'Patient',
                    baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
                }
            };

            mockStructureDefinitionService.create.mockResolvedValue(mockStructureDefinition);

            const result = await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockStructureDefinition);
        });

        it('should handle service errors during creation', async () => {
            const createDto: CreateStructureDefinitionDto = {
                resourceType: 'StructureDefinition',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                name: 'Patient',
                status: 'active',
                kind: 'resource',
                abstract: false,
                type: 'Patient',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                release: 4,
                definition: {
                    kind: 'resource',
                    abstract: false,
                    type: 'Patient'
                }
            };

            mockStructureDefinitionService.create.mockRejectedValue(
                new BadRequestException('URL already exists')
            );

            await expect(controller.create(createDto)).rejects.toThrow(BadRequestException);
            expect(service.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all structure definitions without filters', async () => {
            const mockStructureDefinitions = [mockStructureDefinition];
            mockStructureDefinitionService.findAll.mockResolvedValue(mockStructureDefinitions);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockStructureDefinitions);
        });

        it('should return filtered structure definitions by resourceType', async () => {
            const mockStructureDefinitions = [mockStructureDefinition];
            mockStructureDefinitionService.findAll.mockResolvedValue(mockStructureDefinitions);

            const result = await controller.findAll('StructureDefinition');

            expect(service.findAll).toHaveBeenCalledWith({resourceType: 'StructureDefinition'});
            expect(result).toEqual(mockStructureDefinitions);
        });

        it('should return filtered structure definitions by release', async () => {
            const mockStructureDefinitions = [mockStructureDefinition];
            mockStructureDefinitionService.findAll.mockResolvedValue(mockStructureDefinitions);

            const result = await controller.findAll(undefined, 4);

            expect(service.findAll).toHaveBeenCalledWith({release: 4});
            expect(result).toEqual(mockStructureDefinitions);
        });

        it('should return filtered structure definitions by both resourceType and release', async () => {
            const mockStructureDefinitions = [mockStructureDefinition];
            mockStructureDefinitionService.findAll.mockResolvedValue(mockStructureDefinitions);

            const result = await controller.findAll('StructureDefinition', 4);

            expect(service.findAll).toHaveBeenCalledWith({
                resourceType: 'StructureDefinition',
                release: 4
            });
            expect(result).toEqual(mockStructureDefinitions);
        });

        it('should handle empty results', async () => {
            mockStructureDefinitionService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual([]);
        });
    });

    describe('findByUrl', () => {
        it('should return structure definition by URL', async () => {
            const url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            mockStructureDefinitionService.findByUrl.mockResolvedValue(mockStructureDefinition);

            const result = await controller.findByUrl(url);

            expect(service.findByUrl).toHaveBeenCalledWith(url);
            expect(result).toEqual(mockStructureDefinition);
        });

        it('should handle not found error', async () => {
            const url = 'http://hl7.org/fhir/StructureDefinition/NonExistent';
            mockStructureDefinitionService.findByUrl.mockRejectedValue(
                new NotFoundException(`StructureDefinition with URL '${url}' not found`)
            );

            await expect(controller.findByUrl(url)).rejects.toThrow(NotFoundException);
            expect(service.findByUrl).toHaveBeenCalledWith(url);
        });
    });

    describe('findOne', () => {
        it('should return structure definition by ID', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockStructureDefinitionService.findOne.mockResolvedValue(mockStructureDefinition);

            const result = await controller.findOne(id);

            expect(service.findOne).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockStructureDefinition);
        });

        it('should handle invalid ID error', async () => {
            const invalidId = 'invalid-id';
            mockStructureDefinitionService.findOne.mockRejectedValue(
                new BadRequestException('Invalid StructureDefinition ID')
            );

            await expect(controller.findOne(invalidId)).rejects.toThrow(BadRequestException);
            expect(service.findOne).toHaveBeenCalledWith(invalidId);
        });

        it('should handle not found error', async () => {
            const id = '507f1f77bcf86cd799439012';
            mockStructureDefinitionService.findOne.mockRejectedValue(
                new NotFoundException('StructureDefinition not found')
            );

            await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
            expect(service.findOne).toHaveBeenCalledWith(id);
        });
    });

    describe('update', () => {
        it('should update structure definition', async () => {
            const id = '507f1f77bcf86cd799439011';
            const updateDto: UpdateStructureDefinitionDto = {
                url: 'http://hl7.org/fhir/StructureDefinition/UpdatedPatient',
                definition: {
                    kind: 'resource',
                    abstract: false,
                    type: 'UpdatedPatient'
                }
            };

            const updatedStructureDefinition = {
                ...mockStructureDefinition,
                ...updateDto,
                meta: {
                    versionId: '2',
                    lastUpdated: new Date('2023-01-02T00:00:00.000Z')
                }
            };

            mockStructureDefinitionService.update.mockResolvedValue(updatedStructureDefinition);

            const result = await controller.update(id, updateDto);

            expect(service.update).toHaveBeenCalledWith(id, updateDto);
            expect(result).toEqual(updatedStructureDefinition);
        });

        it('should handle not found error during update', async () => {
            const id = '507f1f77bcf86cd799439012';
            const updateDto: UpdateStructureDefinitionDto = {
                url: 'http://hl7.org/fhir/StructureDefinition/UpdatedPatient'
            };

            mockStructureDefinitionService.update.mockRejectedValue(
                new NotFoundException('StructureDefinition not found')
            );

            await expect(controller.update(id, updateDto)).rejects.toThrow(NotFoundException);
            expect(service.update).toHaveBeenCalledWith(id, updateDto);
        });

        it('should handle URL conflict error during update', async () => {
            const id = '507f1f77bcf86cd799439011';
            const updateDto: UpdateStructureDefinitionDto = {
                url: 'http://hl7.org/fhir/StructureDefinition/ExistingURL'
            };

            mockStructureDefinitionService.update.mockRejectedValue(
                new BadRequestException('StructureDefinition with URL already exists')
            );

            await expect(controller.update(id, updateDto)).rejects.toThrow(BadRequestException);
            expect(service.update).toHaveBeenCalledWith(id, updateDto);
        });
    });

    describe('remove', () => {
        it('should delete structure definition', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockStructureDefinitionService.delete.mockResolvedValue(undefined);

            await controller.remove(id);

            expect(service.delete).toHaveBeenCalledWith(id);
        });

        it('should handle not found error during deletion', async () => {
            const id = '507f1f77bcf86cd799439012';
            mockStructureDefinitionService.delete.mockRejectedValue(
                new NotFoundException('StructureDefinition not found')
            );

            await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
            expect(service.delete).toHaveBeenCalledWith(id);
        });
    });

    describe('edge cases', () => {
        it('should handle empty string filters', async () => {
            mockStructureDefinitionService.findAll.mockResolvedValue([]);

            const result = await controller.findAll('', 0);

            expect(service.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual([]);
        });

        it('should handle null/undefined filters', async () => {
            mockStructureDefinitionService.findAll.mockResolvedValue([mockStructureDefinition]);

            const result = await controller.findAll(undefined, undefined);

            expect(service.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual([mockStructureDefinition]);
        });

        it('should handle service throwing unexpected errors', async () => {
            const createDto: CreateStructureDefinitionDto = {
                resourceType: 'StructureDefinition',
                url: 'http://hl7.org/fhir/StructureDefinition/Test',
                name: 'Test',
                status: 'active',
                kind: 'resource',
                abstract: false,
                type: 'Test',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                release: 4,
                definition: {kind: 'resource'}
            };

            mockStructureDefinitionService.create.mockRejectedValue(new Error('Unexpected error'));

            await expect(controller.create(createDto)).rejects.toThrow('Unexpected error');
        });

        it('should handle complex definition objects in create', async () => {
            const createDto: CreateStructureDefinitionDto = {
                resourceType: 'StructureDefinition',
                url: 'http://hl7.org/fhir/StructureDefinition/Complex',
                name: 'Complex',
                status: 'active',
                kind: 'resource',
                abstract: false,
                type: 'Complex',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                release: 4,
                definition: {
                    kind: 'resource',
                    abstract: false,
                    type: 'Complex',
                    baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                    snapshot: {
                        element: [
                            {
                                id: 'Complex',
                                path: 'Complex',
                                short: 'A complex resource',
                                min: 0,
                                max: '*'
                            }
                        ]
                    },
                    differential: {
                        element: [
                            {
                                id: 'Complex.customField',
                                path: 'Complex.customField',
                                short: 'Custom field',
                                min: 0,
                                max: '1',
                                type: [{code: 'string'}]
                            }
                        ]
                    }
                }
            };

            const complexStructureDefinition = {...mockStructureDefinition, ...createDto};
            mockStructureDefinitionService.create.mockResolvedValue(complexStructureDefinition);

            const result = await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(complexStructureDefinition);
        });
    });
});