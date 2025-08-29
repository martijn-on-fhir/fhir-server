import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateResourceDto } from './update-resource-dto';

describe('UpdateResourceDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(UpdateResourceDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new UpdateResourceDto();
            expect(dto).toBeInstanceOf(UpdateResourceDto);
        });

        it('should have all optional fields', () => {
            const dto = new UpdateResourceDto();
            expect(dto.meta).toBeUndefined();
            expect(dto.implicitRules).toBeUndefined();
            expect(dto.language).toBeUndefined();
            expect(dto.text).toBeUndefined();
            expect(dto.contained).toBeUndefined();
            expect(dto.extension).toBeUndefined();
            expect(dto.modifierExtension).toBeUndefined();
        });
    });

    describe('Meta Field Validation', () => {
        it('should accept valid meta object', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: {
                    versionId: '2',
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
                }
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should validate nested meta object structure', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: {
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
                    tag: [{
                        system: 'http://example.org/tags',
                        code: 'updated'
                    }],
                    security: [{
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
                        code: 'TREAT'
                    }],
                    source: 'https://example.org/fhir'
                }
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should accept missing meta field', async () => {
            const dto = plainToInstance(UpdateResourceDto, {});

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            expect(metaErrors).toHaveLength(0);
        });

        it('should handle null meta', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: null
            });

            const errors = await validate(dto);
            const metaErrors = errors.filter(error => error.property === 'meta');
            
            // Should not cause validation errors since it's optional
            expect(metaErrors).toHaveLength(0);
        });
    });

    describe('ImplicitRules Field Validation', () => {
        it('should accept valid implicitRules URL', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                implicitRules: 'http://hl7.org/fhir/StructureDefinition/Patient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should accept HTTPS implicitRules URL', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                implicitRules: 'https://secure.example.org/fhir/StructureDefinition/CustomPatient'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should accept missing implicitRules field', async () => {
            const dto = plainToInstance(UpdateResourceDto, {});

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(0);
        });

        it('should reject invalid implicitRules URL', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                implicitRules: 'not-a-valid-url'
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(1);
            expect(implicitRulesErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should reject empty implicitRules string', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                implicitRules: ''
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            expect(implicitRulesErrors).toHaveLength(1);
            expect(implicitRulesErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should handle null implicitRules', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                implicitRules: null
            });

            const errors = await validate(dto);
            const implicitRulesErrors = errors.filter(error => error.property === 'implicitRules');
            
            // Should not cause validation errors since it's optional
            expect(implicitRulesErrors).toHaveLength(0);
        });
    });

    describe('Language Field Validation', () => {
        it('should accept valid language code', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                language: 'en-US'
            });

            const errors = await validate(dto);
            const languageErrors = errors.filter(error => error.property === 'language');
            
            expect(languageErrors).toHaveLength(0);
        });

        it('should accept other language codes', async () => {
            const languageCodes = ['en', 'fr', 'de', 'es', 'nl-NL', 'fr-CA'];

            for (const langCode of languageCodes) {
                const dto = plainToInstance(UpdateResourceDto, {
                    language: langCode
                });

                const errors = await validate(dto);
                const languageErrors = errors.filter(error => error.property === 'language');
                
                expect(languageErrors).toHaveLength(0);
            }
        });

        it('should accept missing language field', async () => {
            const dto = plainToInstance(UpdateResourceDto, {});

            const errors = await validate(dto);
            const languageErrors = errors.filter(error => error.property === 'language');
            
            expect(languageErrors).toHaveLength(0);
        });

        it('should reject non-string language', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                language: 123
            });

            const errors = await validate(dto);
            const languageErrors = errors.filter(error => error.property === 'language');
            
            expect(languageErrors).toHaveLength(1);
            expect(languageErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null language', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                language: null
            });

            const errors = await validate(dto);
            const languageErrors = errors.filter(error => error.property === 'language');
            
            // Should not cause validation errors since it's optional
            expect(languageErrors).toHaveLength(0);
        });
    });

    describe('Text Field Validation', () => {
        it('should accept valid text object', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                text: {
                    status: 'generated',
                    div: '<div>Updated patient information</div>'
                }
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(0);
        });

        it('should accept all valid text status values', async () => {
            const statusValues = ['generated', 'extensions', 'additional', 'empty'];

            for (const status of statusValues) {
                const dto = plainToInstance(UpdateResourceDto, {
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

        it('should accept complex div content', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                text: {
                    status: 'generated',
                    div: '<div xmlns="http://www.w3.org/1999/xhtml">Updated <b>patient</b> record with <em>modifications</em></div>'
                }
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(0);
        });

        it('should accept missing text field', async () => {
            const dto = plainToInstance(UpdateResourceDto, {});

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(0);
        });

        it('should reject non-object text', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                text: 'not an object'
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            expect(textErrors).toHaveLength(1);
            expect(textErrors[0].constraints).toHaveProperty('isObject');
        });

        it('should handle null text', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                text: null
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');
            
            // Should not cause validation errors since it's optional
            expect(textErrors).toHaveLength(0);
        });
    });

    describe('Array Fields Validation', () => {
        const arrayFields = ['contained', 'extension', 'modifierExtension'];

        arrayFields.forEach(field => {
            it(`should accept valid ${field} array`, async () => {
                const dto = plainToInstance(UpdateResourceDto, {
                    [field]: [{ test: 'value', id: 'test-id' }]
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept empty ${field} array`, async () => {
                const dto = plainToInstance(UpdateResourceDto, {
                    [field]: []
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(UpdateResourceDto, {});

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                expect(fieldErrors).toHaveLength(0);
            });

            it(`should handle null ${field}`, async () => {
                const dto = plainToInstance(UpdateResourceDto, {
                    [field]: null
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);
                
                // Should not cause validation errors since it's optional
                expect(fieldErrors).toHaveLength(0);
            });
        });

        it('should accept contained resources', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                contained: [
                    {
                        resourceType: 'Organization',
                        id: 'org1',
                        name: 'Updated Healthcare Provider'
                    },
                    {
                        resourceType: 'Practitioner',
                        id: 'prac1',
                        name: [{ family: 'Updated', given: ['Doctor'] }]
                    }
                ]
            });

            const errors = await validate(dto);
            const containedErrors = errors.filter(error => error.property === 'contained');
            
            expect(containedErrors).toHaveLength(0);
        });

        it('should accept extension arrays', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                extension: [
                    {
                        url: 'http://example.org/extension/updated',
                        valueString: 'updated value'
                    },
                    {
                        url: 'http://example.org/extension/version',
                        valueInteger: 2
                    }
                ]
            });

            const errors = await validate(dto);
            const extensionErrors = errors.filter(error => error.property === 'extension');
            
            expect(extensionErrors).toHaveLength(0);
        });

        it('should accept modifierExtension arrays', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                modifierExtension: [
                    {
                        url: 'http://example.org/modifier/critical-update',
                        valueBoolean: true
                    }
                ]
            });

            const errors = await validate(dto);
            const modifierExtensionErrors = errors.filter(error => error.property === 'modifierExtension');
            
            expect(modifierExtensionErrors).toHaveLength(0);
        });
    });

    describe('Dynamic Properties Support', () => {
        it('should support index signature for resource-specific properties', () => {
            const dto = new UpdateResourceDto();
            dto['active'] = false; // Update patient active status
            dto['name'] = [{ family: 'UpdatedName', given: ['Updated'] }];
            dto['customField'] = 'updated custom value';
            
            expect(dto['active']).toBe(false);
            expect(dto['name']).toEqual([{ family: 'UpdatedName', given: ['Updated'] }]);
            expect(dto['customField']).toBe('updated custom value');
        });

        it('should preserve additional properties during validation', async () => {
            const updateData = {
                meta: {
                    versionId: '2'
                },
                active: false,
                name: [{ family: 'UpdatedFamily', given: ['UpdatedGiven'] }],
                customUpdateField: 'custom update value',
                nestedUpdate: {
                    field: 'updated value',
                    number: 100
                }
            };

            const dto = plainToInstance(UpdateResourceDto, updateData);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
            expect(dto['active']).toBe(false);
            expect(dto['name']).toEqual([{ family: 'UpdatedFamily', given: ['UpdatedGiven'] }]);
            expect(dto['customUpdateField']).toBe('custom update value');
            expect(dto['nestedUpdate']).toEqual({
                field: 'updated value',
                number: 100
            });
        });
    });

    describe('Complete Update Examples', () => {
        it('should validate minimal update with meta only', async () => {
            const minimalUpdate = {
                meta: {
                    versionId: '2'
                }
            };

            const dto = plainToInstance(UpdateResourceDto, minimalUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate comprehensive patient update', async () => {
            const patientUpdate = {
                meta: {
                    versionId: '3',
                    profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
                    tag: [{
                        system: 'http://example.org/tags',
                        code: 'updated-patient'
                    }]
                },
                language: 'en-US',
                text: {
                    status: 'generated',
                    div: '<div>Updated patient: John Updated Doe</div>'
                },
                extension: [{
                    url: 'http://example.org/extension/last-updated-by',
                    valueString: 'system-admin'
                }],
                active: true,
                name: [{
                    use: 'official',
                    family: 'UpdatedDoe',
                    given: ['John', 'Updated']
                }],
                telecom: [{
                    system: 'email',
                    value: 'john.updated@example.com',
                    use: 'home'
                }],
                birthDate: '1985-03-15'
            };

            const dto = plainToInstance(UpdateResourceDto, patientUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate observation update', async () => {
            const observationUpdate = {
                meta: {
                    versionId: '2',
                    tag: [{ code: 'corrected' }]
                },
                text: {
                    status: 'generated',
                    div: '<div>Corrected blood pressure reading</div>'
                },
                status: 'corrected',
                valueQuantity: {
                    value: 125, // Updated value
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                },
                note: [{
                    text: 'Value corrected due to calibration error'
                }]
            };

            const dto = plainToInstance(UpdateResourceDto, observationUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate update with contained resources', async () => {
            const updateWithContained = {
                meta: {
                    versionId: '2'
                },
                contained: [
                    {
                        resourceType: 'Organization',
                        id: 'org-updated',
                        name: 'Updated Medical Center',
                        telecom: [{
                            system: 'phone',
                            value: '+1-555-0199'
                        }]
                    }
                ],
                extension: [{
                    url: 'http://example.org/extension/contained-updated',
                    valueReference: {
                        reference: '#org-updated'
                    }
                }]
            };

            const dto = plainToInstance(UpdateResourceDto, updateWithContained);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate empty update object', async () => {
            const dto = plainToInstance(UpdateResourceDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                implicitRules: 'not-a-url', // Invalid URL
                language: 123, // Non-string
                text: 'not an object' // Non-object
            };

            const dto = plainToInstance(UpdateResourceDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.implicitRules).toBeDefined();
            expect(errorsByProperty.language).toBeDefined();
            expect(errorsByProperty.text).toBeDefined();
        });

        it('should handle all null values', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: null,
                implicitRules: null,
                language: null,
                text: null,
                contained: null,
                extension: null,
                modifierExtension: null
            });

            const errors = await validate(dto);
            
            // All fields are optional, so null should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle undefined values', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: undefined,
                implicitRules: undefined,
                language: undefined,
                text: undefined,
                contained: undefined,
                extension: undefined,
                modifierExtension: undefined
            });

            const errors = await validate(dto);
            
            // All fields are optional, so undefined should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle nested meta validation errors', async () => {
            const dto = plainToInstance(UpdateResourceDto, {
                meta: {
                    profile: ['valid-profile', 123], // Invalid profile array element
                    source: 'invalid-url' // Invalid URL
                }
            });

            const errors = await validate(dto);
            
            // Should have nested validation errors for meta object
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});