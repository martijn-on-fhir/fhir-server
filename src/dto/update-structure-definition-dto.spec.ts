import {validate} from 'class-validator';
import {UpdateStructureDefinitionDto} from './update-structure-definition-dto';

describe('UpdateStructureDefinitionDto', () => {
    let dto: UpdateStructureDefinitionDto;

    beforeEach(() => {
        dto = new UpdateStructureDefinitionDto();
    });

    it('should be defined', () => {
        expect(dto).toBeDefined();
    });

    describe('validation', () => {
        it('should pass validation with empty object', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only url provided', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/UpdatedPatient';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only definition provided', async () => {
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'UpdatedResource',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only resourceType provided', async () => {
            dto.resourceType = 'StructureDefinition';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only release provided', async () => {
            dto.release = 5;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with all fields provided', async () => {
            dto.resourceType = 'StructureDefinition';
            dto.url = 'http://hl7.org/fhir/StructureDefinition/CompleteUpdate';
            dto.release = 4;
            dto.definition = {
                kind: 'resource',
                abstract: false,
                type: 'CompleteUpdate',
                baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when url is not a string', async () => {
            (dto as any).url = 123;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('url');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when definition is not an object', async () => {
            (dto as any).definition = 'invalid';

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('definition');
            expect(errors[0].constraints).toHaveProperty('isObject');
        });

        it('should fail validation when resourceType is not a string', async () => {
            (dto as any).resourceType = 123;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('resourceType');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should pass validation with partial complex definition', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/PartialUpdate';
            dto.definition = {
                kind: 'resource',
                differential: {
                    element: [
                        {
                            id: 'Resource.newField',
                            path: 'Resource.newField',
                            short: 'A new field added in update',
                            min: 0,
                            max: '1',
                            type: [{code: 'string'}]
                        }
                    ]
                }
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with nested objects in partial definition', async () => {
            dto.definition = {
                snapshot: {
                    element: [
                        {
                            id: 'Patient.identifier',
                            path: 'Patient.identifier',
                            slicing: {
                                discriminator: [
                                    {
                                        type: 'pattern',
                                        path: 'type'
                                    }
                                ],
                                rules: 'open'
                            }
                        }
                    ]
                }
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('partial type behavior', () => {
        it('should inherit validation from CreateStructureDefinitionDto', async () => {
            // Invalid type should still fail validation even in partial
            (dto as any).url = [];
            (dto as any).definition = 'not an object';

            const errors = await validate(dto);
            expect(errors).toHaveLength(2);

            const urlError = errors.find(error => error.property === 'url');
            const definitionError = errors.find(error => error.property === 'definition');

            expect(urlError?.constraints).toHaveProperty('isString');
            expect(definitionError?.constraints).toHaveProperty('isObject');
        });

        it('should allow undefined values for optional properties', async () => {
            dto.url = undefined;
            dto.definition = undefined;
            // Note: resourceType and release have default values from the parent class
            // so they won't be undefined when using the DTO

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should maintain type safety for valid partial updates', () => {
            // TypeScript compilation test - these should be valid assignments
            dto.url = 'http://example.com';
            dto.definition = {kind: 'resource'};
            dto.resourceType = 'StructureDefinition';
            dto.release = 4;

            expect(dto.url).toBe('http://example.com');
            expect(dto.definition).toEqual({kind: 'resource'});
            expect(dto.resourceType).toBe('StructureDefinition');
            expect(dto.release).toBe(4);
        });
    });

    describe('use cases', () => {
        it('should support URL-only updates', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/NewURL';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.url).toBe('http://hl7.org/fhir/StructureDefinition/NewURL');
        });

        it('should support definition-only updates', async () => {
            dto.definition = {
                kind: 'complex-type',
                abstract: true,
                type: 'CustomType'
            };

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.definition.kind).toBe('complex-type');
            expect(dto.definition.abstract).toBe(true);
        });

        it('should support release version updates', async () => {
            dto.release = 5;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.release).toBe(5);
        });

        it('should support mixed partial updates', async () => {
            dto.url = 'http://hl7.org/fhir/StructureDefinition/Mixed';
            dto.release = 3;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.url).toBe('http://hl7.org/fhir/StructureDefinition/Mixed');
            expect(dto.release).toBe(3);
            expect(dto.definition).toBeUndefined();
            // resourceType has a default value from the parent class
            expect(dto.resourceType).toBe('StructureDefinition');
        });
    });
});