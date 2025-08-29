import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidateResourceDto } from './validate-resource-dto';

describe('ValidateResourceDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(ValidateResourceDto).toBeDefined();
        });

        it('should extend CreateResourceDto', () => {
            const dto = new ValidateResourceDto();
            expect(dto).toHaveProperty('resourceType');
            expect(dto).toHaveProperty('id');
            expect(dto).toHaveProperty('meta');
        });

        it('should allow instantiation', () => {
            const dto = new ValidateResourceDto();
            expect(dto).toBeInstanceOf(ValidateResourceDto);
        });
    });

    describe('Validation Inheritance', () => {
        it('should validate required resourceType field', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                // Missing resourceType
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isNotEmpty');
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isString');
        });

        it('should accept valid resourceType', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient'
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(0);
        });

        it('should reject empty resourceType', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: ''
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should reject non-string resourceType', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 123
            });

            const errors = await validate(dto);
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            
            expect(resourceTypeErrors).toHaveLength(1);
            expect(resourceTypeErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Optional Field Validation', () => {
        it('should accept valid optional id', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                id: 'patient-123'
            });

            const errors = await validate(dto);
            const idErrors = errors.filter(error => error.property === 'id');
            
            expect(idErrors).toHaveLength(0);
        });

        it('should accept missing optional id', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient'
            });

            const errors = await validate(dto);
            const idErrors = errors.filter(error => error.property === 'id');
            
            expect(idErrors).toHaveLength(0);
        });

        it('should reject non-string id', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                id: 123
            });

            const errors = await validate(dto);
            const idErrors = errors.filter(error => error.property === 'id');
            
            expect(idErrors).toHaveLength(1);
            expect(idErrors[0].constraints).toHaveProperty('isString');
        });

        it('should validate nested meta object', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                meta: {
                    versionId: '1',
                    lastUpdated: '2023-08-03T12:00:00Z'
                }
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should accept valid implicitRules URL', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                implicitRules: 'http://hl7.org/fhir/StructureDefinition/Patient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should reject invalid implicitRules URL', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                implicitRules: 'not-a-valid-url'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(1);
            expect(implicitRulesErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should accept valid language code', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                language: 'en-US'
            });

            const errors = await validate(dto);
            const languageErrors = errors.filter(error => error.property === 'language');
            
            expect(languageErrors).toHaveLength(0);
        });

        it('should accept valid text object', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
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
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                text: 'not an object'
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(1);
            expect(textErrors[0].constraints).toHaveProperty('isObject');
        });
    });

    describe('FHIR Resource Examples', () => {
        it('should validate complete Patient resource', async () => {
            const patientData = {
                resourceType: 'Patient',
                id: 'patient-123',
                meta: {
                    versionId: '1',
                    lastUpdated: '2023-08-03T12:00:00Z',
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
                },
                language: 'en-US',
                text: {
                    status: 'generated',
                    div: '<div>John Doe, male, born 1985-03-15</div>'
                },
                active: true,
                name: [{
                    use: 'official',
                    family: 'Doe',
                    given: ['John']
                }],
                gender: 'male',
                birthDate: '1985-03-15'
            };

            const dto = plainToInstance(ValidateResourceDto, patientData);
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

            const dto = plainToInstance(ValidateResourceDto, observationData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate minimal required resource', async () => {
            const minimalData = {
                resourceType: 'Organization'
            };

            const dto = plainToInstance(ValidateResourceDto, minimalData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Dynamic Properties Support', () => {
        it('should support index signature for resource-specific properties', () => {
            const dto = new ValidateResourceDto();
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

            const dto = plainToInstance(ValidateResourceDto, dataWithExtraProps);
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

    describe('Extension Properties', () => {
        it('should accept extension arrays', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                extension: [{
                    url: 'http://example.org/extension',
                    valueString: 'extension value'
                }]
            });

            const errors = await validate(dto);
            const extensionErrors = errors.filter(error => error.property === 'extension');
            
            expect(extensionErrors).toHaveLength(0);
        });

        it('should accept modifierExtension arrays', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                modifierExtension: [{
                    url: 'http://example.org/modifier-extension',
                    valueBoolean: true
                }]
            });

            const errors = await validate(dto);
            const modifierExtensionErrors = errors.filter(error => error.property === 'modifierExtension');
            
            expect(modifierExtensionErrors).toHaveLength(0);
        });

        it('should accept contained resources array', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Bundle',
                contained: [{
                    resourceType: 'Patient',
                    id: 'contained-patient',
                    active: true
                }]
            });

            const errors = await validate(dto);
            const containedErrors = errors.filter(error => error.property === 'contained');
            
            expect(containedErrors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                resourceType: '', // Empty - should fail isNotEmpty
                id: 123, // Number - should fail isString
                implicitRules: 'not-a-url', // Invalid URL
                text: 'not an object' // String - should fail isObject
            };

            const dto = plainToInstance(ValidateResourceDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.resourceType).toBeDefined();
            expect(errorsByProperty.id).toBeDefined();
            expect(errorsByProperty.implicitRules).toBeDefined();
            expect(errorsByProperty.text).toBeDefined();
        });

        it('should handle null values appropriately', async () => {
            const dto = plainToInstance(ValidateResourceDto, {
                resourceType: 'Patient',
                id: null,
                language: null,
                text: null
            });

            const errors = await validate(dto);
            
            // Optional fields with null should not cause validation errors
            // Only non-nullable constraints should fail
            const resourceTypeErrors = errors.filter(error => error.property === 'resourceType');
            expect(resourceTypeErrors).toHaveLength(0);
        });
    });
});