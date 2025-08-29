import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateResourceDto } from './create-resource-dto';

describe('CreateResourceDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(CreateResourceDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new CreateResourceDto();
            expect(dto).toBeInstanceOf(CreateResourceDto);
        });
    });

    describe('Required Field Validation', () => {
        it('should require resourceType field', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                // Missing resourceType
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isNotEmpty');
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isString');
        });

        it('should accept valid resourceType', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient'
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(0);
        });

        it('should reject empty resourceType', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: ''
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should reject non-string resourceType', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 123
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Optional String Fields', () => {
        const stringFields = ['id', 'language'];

        stringFields.forEach(field => {
            it(`should accept valid ${field}`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient',
                    [field]: 'valid-string'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-string ${field}`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient',
                    [field]: 123
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isString');
            });
        });
    });

    describe('URL Field Validation', () => {
        it('should accept valid implicitRules URL', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                implicitRules: 'http://hl7.org/fhir/StructureDefinition/Patient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should accept HTTPS URLs', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                implicitRules: 'https://example.com/fhir/StructureDefinition/Patient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should reject invalid implicitRules URL', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                implicitRules: 'not-a-valid-url'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(1);
            expect(implicitRulesErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should accept missing implicitRules', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });
    });

    describe('Nested Object Validation', () => {
        it('should validate nested meta object', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                meta: {
                    versionId: '1',
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
                }
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should accept missing meta', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient'
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should accept valid text object', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                text: {
                    status: 'generated',
                    div: '<div>Patient summary</div>'
                }
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(0);
        });

        it('should reject non-object text', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                text: 'not an object'
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(1);
            expect(textErrors[0].constraints).toHaveProperty('isObject');
        });
    });

    describe('Array Fields', () => {
        const arrayFields = ['contained', 'extension', 'modifierExtension'];

        arrayFields.forEach(field => {
            it(`should accept valid ${field} array`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient',
                    [field]: [{ test: 'value' }]
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept empty ${field} array`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient',
                    [field]: []
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });
        });
    });

    describe('FHIR Resource Examples', () => {
        it('should validate complete Patient resource', async () => {
            const patientData = {
                resourceType: 'Patient',
                id: 'patient-123',
                meta: {
                    versionId: '1',
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
                    tag: [{ system: 'http://example.org/tags', code: 'test' }]
                },
                implicitRules: 'http://hl7.org/fhir/StructureDefinition/Patient',
                language: 'en-US',
                text: {
                    status: 'generated',
                    div: '<div>John Doe, male, born 1985-03-15</div>'
                },
                contained: [{
                    resourceType: 'Organization',
                    id: 'org1',
                    name: 'Test Organization'
                }],
                extension: [{
                    url: 'http://example.org/extension',
                    valueString: 'extension value'
                }],
                modifierExtension: [{
                    url: 'http://example.org/modifier-extension',
                    valueBoolean: true
                }],
                active: true,
                name: [{
                    use: 'official',
                    family: 'Doe',
                    given: ['John']
                }],
                gender: 'male',
                birthDate: '1985-03-15'
            };

            const dto = plainToInstance(CreateResourceDto, patientData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate Observation resource', async () => {
            const observationData = {
                resourceType: 'Observation',
                id: 'obs-001',
                status: 'final',
                category: [{
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code: 'vital-signs',
                        display: 'Vital Signs'
                    }]
                }],
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '85354-9',
                        display: 'Blood pressure'
                    }]
                },
                subject: {
                    reference: 'Patient/patient-123'
                },
                effectiveDateTime: '2023-08-03T14:30:00Z',
                valueQuantity: {
                    value: 120,
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                }
            };

            const dto = plainToInstance(CreateResourceDto, observationData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate minimal required resource', async () => {
            const minimalData = {
                resourceType: 'Organization'
            };

            const dto = plainToInstance(CreateResourceDto, minimalData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Dynamic Properties Support', () => {
        it('should support index signature for resource-specific properties', () => {
            const dto = new CreateResourceDto();
            dto.resourceType = 'Patient';
            dto['customField'] = 'custom value';
            dto['active'] = true;
            dto['name'] = [{ family: 'Test' }];
            
            expect(dto['customField']).toBe('custom value');
            expect(dto['active']).toBe(true);
            expect(dto['name']).toEqual([{ family: 'Test' }]);
        });

        it('should preserve additional properties during validation', async () => {
            const dataWithExtraProps = {
                resourceType: 'Patient',
                id: 'pat-001',
                active: true,
                customProperty: 'should be preserved',
                nestedCustom: {
                    field: 'value',
                    number: 42
                }
            };

            const dto = plainToInstance(CreateResourceDto, dataWithExtraProps);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
            expect(dto['active']).toBe(true);
            expect(dto['customProperty']).toBe('should be preserved');
            expect(dto['nestedCustom']).toEqual({
                field: 'value',
                number: 42
            });
        });
    });

    describe('Text Object Validation', () => {
        it('should accept all valid text status values', async () => {
            const statusValues = ['generated', 'extensions', 'additional', 'empty'];

            for (const status of statusValues) {
                const dto = plainToInstance(CreateResourceDto, {
                    resourceType: 'Patient',
                    text: {
                        status: status as any,
                        div: '<div>Test content</div>'
                    }
                });

                const errors = await validate(dto);
                const textErrors = errors.filter(error => error.property === 'text');
                
                expect(textErrors).toHaveLength(0);
            }
        });

        it('should accept text with different div content', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                text: {
                    status: 'generated',
                    div: '<div xmlns="http://www.w3.org/1999/xhtml">Rich HTML content with <b>formatting</b></div>'
                }
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                resourceType: '', // Empty - should fail isNotEmpty
                id: 123, // Number - should fail isString
                implicitRules: 'not-a-url', // Invalid URL
                language: 456, // Number - should fail isString
                text: 'not an object' // String - should fail isObject
            };

            const dto = plainToInstance(CreateResourceDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.resourceType).toBeDefined();
            expect(errorsByProperty.id).toBeDefined();
            expect(errorsByProperty.implicitRules).toBeDefined();
            expect(errorsByProperty.language).toBeDefined();
            expect(errorsByProperty.text).toBeDefined();
        });

        it('should handle null values appropriately', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                id: null,
                language: null,
                text: null,
                meta: null
            });

            const errors = await validate(dto);
            
            // Required resourceType should not have errors
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            expect(resourceTypeErrors).toHaveLength(0);
        });

        it('should handle undefined vs null appropriately', async () => {
            const dto = plainToInstance(CreateResourceDto, {
                resourceType: 'Patient',
                id: undefined,
                language: undefined,
                implicitRules: undefined
            });

            const errors = await validate(dto);
            
            // Optional fields with undefined should not cause validation errors
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            expect(resourceTypeErrors).toHaveLength(0);
        });
    });
});