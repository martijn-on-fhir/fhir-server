import {validate} from 'class-validator';
import {CreateStructureDefinitionDto} from './create-structure-definition-dto';

describe('CreateStructureDefinitionDto', () => {
    let dto: CreateStructureDefinitionDto;

    beforeEach(() => {
        dto = new CreateStructureDefinitionDto();
    });

    it('should be defined', () => {
        expect(dto).toBeDefined();
    });

    it('should have default values', () => {
        expect(dto.resourceType).toBe('StructureDefinition');
        expect(dto.release).toBe(4);
    });

    describe('validation', () => {
        it('should pass validation with valid data', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.baseDefinition = 'http://hl7.org/fhir/StructureDefinition/DomainResource';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'Patient',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when url is missing', async () => {
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'Patient'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('url');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when url is not a string', async () => {
            (dto as any).url = 123;
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'Patient'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('url');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when definition is missing', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('definition');
            expect(errors[0].constraints).toHaveProperty('isObject');
        });

        it('should fail validation when definition is not an object', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            (dto as any).definition = 'invalid';

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('definition');
            expect(errors[0].constraints).toHaveProperty('isObject');
        });

        it('should fail validation when resourceType is not a string', async () => {
            (dto as any).resourceType = 123;
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'Patient'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('resourceType');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when name is missing', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = { kind: 'resource', abstract: false, type: 'Patient' };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('name');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when status is invalid', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            (dto as any).status = 'invalid-status';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = { kind: 'resource', abstract: false, type: 'Patient' };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('status');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when kind is invalid', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            (dto as any).kind = 'invalid-kind';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.definition = { kind: 'resource', abstract: false, type: 'Patient' };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('kind');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when abstract is not boolean', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            (dto as any).abstract = 'not-boolean';
            dto.type = 'Patient';
            dto.definition = { kind: 'resource', abstract: false, type: 'Patient' };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('abstract');
            expect(errors[0].constraints).toHaveProperty('isBoolean');
        });

        it('should fail validation when type is missing', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.definition = { kind: 'resource', abstract: false, type: 'Patient' };

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('type');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should pass validation with complex definition object', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Patient';
            dto.name = 'Patient';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Patient';
            dto.baseDefinition = 'http://hl7.org/fhir/StructureDefinition/DomainResource';
            dto.derivation = 'specialization';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'Patient',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                derivation: 'specialization',
                snapshot: {
                    element: [
                        {
                            id: 'Patient',
                            path: 'Patient',
                            short: 'Information about an individual or animal receiving care',
                            definition: 'Demographics and other administrative information about an individual or animal receiving care or other health-related services.',
                            min: 0,
                            max: '*',
                            base: {
                                path: 'Patient',
                                min: 0,
                                max: '*'
                            }
                        }
                    ]
                }
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with nested objects in definition', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/CustomResource';
            dto.name = 'CustomResource';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'CustomResource';
            dto.baseDefinition = 'http://hl7.org/fhir/StructureDefinition/DomainResource';
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'CustomResource',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
                differential: {
                    element: [
                        {
                            id: 'CustomResource.customField',
                            path: 'CustomResource.customField',
                            short: 'A custom field',
                            min: 0,
                            max: '1',
                            type: [
                                {
                                    code: 'string'
                                }
                            ]
                        }
                    ]
                }
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('properties', () => {
        it('should accept valid URL formats', async () => {
            const validUrls = [
                'http://hl7.org/fhir/StructureDefinition/Patient',
                'https://example.com/fhir/StructureDefinition/CustomResource',
                'http://terminology.hl7.org/StructureDefinition/Extension'
            ];

            for (const url of validUrls) {
                dto.url = url;
                dto.name = 'Test';
                dto.status = 'active';
                dto.kind = 'resource';
                dto.abstract = false;
                dto.type = 'Test';
                dto.definition = {kind: 'resource', abstract: false, type: 'Test'};

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });

        it('should accept different release versions', () => {
            dto.release = 3;
            expect(dto.release).toBe(3);

            dto.release = 5;
            expect(dto.release).toBe(5);
        });

        it('should accept empty definition object', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Test';
            dto.name = 'Test';
            dto.status = 'active';
            dto.kind = 'resource';
            dto.abstract = false;
            dto.type = 'Test';
            dto.definition = {};

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});