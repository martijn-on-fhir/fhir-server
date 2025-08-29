import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FhirMetaCreateDto } from './fhir-meta-create-dto';

describe('FhirMetaCreateDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(FhirMetaCreateDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new FhirMetaCreateDto();
            expect(dto).toBeInstanceOf(FhirMetaCreateDto);
        });

        it('should have all optional fields', () => {
            const dto = new FhirMetaCreateDto();
            expect(dto.profile).toBeUndefined();
            expect(dto.security).toBeUndefined();
            expect(dto.tag).toBeUndefined();
            expect(dto.source).toBeUndefined();
        });
    });

    describe('Profile Field Validation', () => {
        it('should accept valid profile array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(0);
        });

        it('should accept multiple profile URLs', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: [
                    'http://hl7.org/fhir/StructureDefinition/Patient',
                    'http://nictiz.nl/fhir/StructureDefinition/nl-core-Patient',
                    'http://example.org/fhir/StructureDefinition/CustomPatient'
                ]
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(0);
        });

        it('should accept empty profile array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: []
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(0);
        });

        it('should accept missing profile field', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {});

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(0);
        });

        it('should reject non-string elements in profile array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: ['valid-string', 123, 'another-string']
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(1);
            expect(profileErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null profile', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: null
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            // Should not cause validation errors since it's optional
            expect(profileErrors).toHaveLength(0);
        });
    });

    describe('Security Field Validation', () => {
        it('should accept valid security array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                security: [{
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                    code: 'HTEST',
                    display: 'test health data'
                }]
            });

            const errors = await validate(dto);
            const securityErrors = errors.filter(error => error.property === 'security');
            
            expect(securityErrors).toHaveLength(0);
        });

        it('should accept multiple security labels', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                security: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                        code: 'HTEST'
                    },
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                        code: 'N',
                        display: 'Normal'
                    },
                    {
                        system: 'http://example.org/security',
                        code: 'internal'
                    }
                ]
            });

            const errors = await validate(dto);
            const securityErrors = errors.filter(error => error.property === 'security');
            
            expect(securityErrors).toHaveLength(0);
        });

        it('should accept empty security array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                security: []
            });

            const errors = await validate(dto);
            const securityErrors = errors.filter(error => error.property === 'security');
            
            expect(securityErrors).toHaveLength(0);
        });

        it('should accept missing security field', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {});

            const errors = await validate(dto);
            const securityErrors = errors.filter(error => error.property === 'security');
            
            expect(securityErrors).toHaveLength(0);
        });

        it('should accept various security object formats', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                security: [
                    { code: 'simple-code' },
                    { system: 'http://example.org', code: 'with-system' },
                    { system: 'http://example.org', code: 'full', display: 'Full example' },
                    { nested: { structure: true } }
                ]
            });

            const errors = await validate(dto);
            const securityErrors = errors.filter(error => error.property === 'security');
            
            expect(securityErrors).toHaveLength(0);
        });
    });

    describe('Tag Field Validation', () => {
        it('should accept valid tag array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                tag: [{
                    system: 'http://example.org/tags',
                    code: 'workflow',
                    display: 'Workflow related'
                }]
            });

            const errors = await validate(dto);
            const tagErrors = errors.filter(error => error.property === 'tag');
            
            expect(tagErrors).toHaveLength(0);
        });

        it('should accept multiple tags', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                tag: [
                    {
                        system: 'http://example.org/tags',
                        code: 'workflow'
                    },
                    {
                        system: 'http://example.org/categories',
                        code: 'cardiac',
                        display: 'Cardiac care'
                    },
                    {
                        code: 'priority-high'
                    }
                ]
            });

            const errors = await validate(dto);
            const tagErrors = errors.filter(error => error.property === 'tag');
            
            expect(tagErrors).toHaveLength(0);
        });

        it('should accept empty tag array', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                tag: []
            });

            const errors = await validate(dto);
            const tagErrors = errors.filter(error => error.property === 'tag');
            
            expect(tagErrors).toHaveLength(0);
        });

        it('should accept missing tag field', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {});

            const errors = await validate(dto);
            const tagErrors = errors.filter(error => error.property === 'tag');
            
            expect(tagErrors).toHaveLength(0);
        });

        it('should accept various tag object formats', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                tag: [
                    { code: 'simple' },
                    { system: 'http://example.org', code: 'system-code' },
                    { version: '1.0', userSelected: true },
                    { custom: { field: 'value' } }
                ]
            });

            const errors = await validate(dto);
            const tagErrors = errors.filter(error => error.property === 'tag');
            
            expect(tagErrors).toHaveLength(0);
        });
    });

    describe('Source Field Validation', () => {
        it('should accept valid source URL', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: 'http://example.org/fhir/source'
            });

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            expect(sourceErrors).toHaveLength(0);
        });

        it('should accept HTTPS source URL', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: 'https://secure.example.org/fhir/endpoint'
            });

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            expect(sourceErrors).toHaveLength(0);
        });

        it('should accept missing source field', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {});

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            expect(sourceErrors).toHaveLength(0);
        });

        it('should reject invalid source URL', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: 'not-a-valid-url'
            });

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            expect(sourceErrors).toHaveLength(1);
            expect(sourceErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should reject empty source string', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: ''
            });

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            expect(sourceErrors).toHaveLength(1);
            expect(sourceErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should handle null source', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: null
            });

            const errors = await validate(dto);
            const sourceErrors = errors.filter(error => error.property === 'source');
            
            // Should not cause validation errors since it's optional
            expect(sourceErrors).toHaveLength(0);
        });
    });

    describe('Complete Meta Examples', () => {
        it('should validate minimal meta with single profile', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate complete meta with all fields', async () => {
            const completeMeta = {
                profile: [
                    'http://hl7.org/fhir/StructureDefinition/Patient',
                    'http://nictiz.nl/fhir/StructureDefinition/nl-core-Patient'
                ],
                security: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                        code: 'HTEST',
                        display: 'test health data'
                    },
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                        code: 'N',
                        display: 'Normal'
                    }
                ],
                tag: [
                    {
                        system: 'http://example.org/tags',
                        code: 'workflow',
                        display: 'Workflow related'
                    },
                    {
                        system: 'http://example.org/departments',
                        code: 'cardiology'
                    }
                ],
                source: 'https://hospital-a.example.org/fhir'
            };

            const dto = plainToInstance(FhirMetaCreateDto, completeMeta);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate empty meta object', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate meta with only security labels', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                security: [
                    { system: 'http://example.org/security', code: 'restricted' }
                ]
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate meta with only tags', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                tag: [
                    { code: 'test-data' },
                    { system: 'http://example.org/workflow', code: 'automated' }
                ]
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate meta with only source', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                source: 'https://external-system.example.org/api/fhir'
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Real-world Examples', () => {
        it('should validate Dutch healthcare profile meta', async () => {
            const dutchMeta = {
                profile: [
                    'http://nictiz.nl/fhir/StructureDefinition/nl-core-Patient'
                ],
                tag: [
                    {
                        system: 'http://nictiz.nl/fhir/CodeSystem/nl-core-tags',
                        code: 'bsn-verified'
                    }
                ],
                source: 'https://zorgverlener.example.nl/fhir'
            };

            const dto = plainToInstance(FhirMetaCreateDto, dutchMeta);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate US Core profile meta', async () => {
            const usCoreMeta = {
                profile: [
                    'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'
                ],
                security: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                        code: 'TREAT',
                        display: 'treatment'
                    }
                ],
                tag: [
                    {
                        system: 'http://example-hospital.org/tags',
                        code: 'emergency-contact-verified'
                    }
                ]
            };

            const dto = plainToInstance(FhirMetaCreateDto, usCoreMeta);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate test data meta', async () => {
            const testMeta = {
                profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
                security: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                        code: 'HTEST'
                    }
                ],
                tag: [
                    { code: 'synthetic-data' },
                    { code: 'test-suite' }
                ],
                source: 'https://test-data-generator.example.org'
            };

            const dto = plainToInstance(FhirMetaCreateDto, testMeta);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                profile: ['valid-profile', 123, 'another-profile'], // Mixed types
                source: 'not-a-url' // Invalid URL
            };

            const dto = plainToInstance(FhirMetaCreateDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.profile).toBeDefined();
            expect(errorsByProperty.source).toBeDefined();
        });

        it('should handle all null values', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: null,
                security: null,
                tag: null,
                source: null
            });

            const errors = await validate(dto);
            
            // All fields are optional, so null should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle undefined values', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: undefined,
                security: undefined,
                tag: undefined,
                source: undefined
            });

            const errors = await validate(dto);
            
            // All fields are optional, so undefined should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle invalid profile array elements', async () => {
            const dto = plainToInstance(FhirMetaCreateDto, {
                profile: [null, undefined, '', 'valid-profile', 123]
            });

            const errors = await validate(dto);
            const profileErrors = errors.filter(error => error.property === 'profile');
            
            expect(profileErrors).toHaveLength(1);
            expect(profileErrors[0].constraints).toHaveProperty('isString');
        });
    });
});