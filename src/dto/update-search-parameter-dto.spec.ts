import {validate} from 'class-validator';
import {plainToInstance} from 'class-transformer';
import {UpdateSearchParameterDto} from './update-search-parameter-dto';
import {
    SearchParameterStatus,
    SearchParameterType,
    XPathUsage,
    SearchComparator,
    SearchModifier
} from '../schema/search-parameter.schema';

describe('UpdateSearchParameterDto', () => {

    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(UpdateSearchParameterDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new UpdateSearchParameterDto();
            expect(dto).toBeInstanceOf(UpdateSearchParameterDto);
        });

        it('should have all optional fields', () => {
            const dto = new UpdateSearchParameterDto();
            // resourceType has a default value from the parent DTO
            expect(dto.resourceType).toBe('SearchParameter');
            expect(dto.url).toBeUndefined();
            expect(dto.name).toBeUndefined();
            expect(dto.status).toBeUndefined();
            expect(dto.code).toBeUndefined();
            expect(dto.base).toBeUndefined();
            expect(dto.type).toBeUndefined();
        });
    });

    describe('URL Field Validation', () => {
        it('should accept valid canonical URL', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: 'http://hl7.org/fhir/SearchParameter/Patient-name'
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(0);
        });

        it('should accept updated URL', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: 'http://example.org/fhir/SearchParameter/Patient-identifier'
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(0);
        });

        it('should accept missing URL field', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(0);
        });

        it('should reject non-string URL', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: 123
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(1);
            expect(urlErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null URL', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: null
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(0);
        });
    });

    describe('Name Field Validation', () => {
        it('should accept valid name', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                name: 'patient-name'
            });

            const errors = await validate(dto);
            const nameErrors = errors.filter(error => error.property === 'name');

            expect(nameErrors).toHaveLength(0);
        });

        it('should accept updated name', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                name: 'updated-search-param'
            });

            const errors = await validate(dto);
            const nameErrors = errors.filter(error => error.property === 'name');

            expect(nameErrors).toHaveLength(0);
        });

        it('should accept missing name field', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            const nameErrors = errors.filter(error => error.property === 'name');

            expect(nameErrors).toHaveLength(0);
        });

        it('should reject non-string name', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                name: 456
            });

            const errors = await validate(dto);
            const nameErrors = errors.filter(error => error.property === 'name');

            expect(nameErrors).toHaveLength(1);
            expect(nameErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Status Field Validation', () => {
        it('should accept all valid SearchParameterStatus values', async () => {
            const validStatuses = Object.values(SearchParameterStatus);

            for (const status of validStatuses) {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    status: status
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter(error => error.property === 'status');

                expect(statusErrors).toHaveLength(0);
            }
        });

        it('should accept DRAFT status', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                status: SearchParameterStatus.DRAFT
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(0);
        });

        it('should accept ACTIVE status', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                status: SearchParameterStatus.ACTIVE
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(0);
        });

        it('should accept RETIRED status', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                status: SearchParameterStatus.RETIRED
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(0);
        });

        it('should accept missing status field', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(0);
        });

        it('should reject invalid status values', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                status: 'invalid-status'
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(1);
            expect(statusErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Type Field Validation', () => {
        it('should accept all valid SearchParameterType values', async () => {
            const validTypes = Object.values(SearchParameterType);

            for (const type of validTypes) {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    type: type
                });

                const errors = await validate(dto);
                const typeErrors = errors.filter(error => error.property === 'type');

                expect(typeErrors).toHaveLength(0);
            }
        });

        it('should accept STRING type', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(0);
        });

        it('should accept TOKEN type', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                type: SearchParameterType.TOKEN
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(0);
        });

        it('should accept REFERENCE type', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                type: SearchParameterType.REFERENCE
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(0);
        });

        it('should reject invalid type values', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                type: 'invalid-type'
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Base Array Field Validation', () => {
        it('should accept valid base resource types array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                base: ['Patient', 'Practitioner']
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(0);
        });

        it('should accept updated base array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                base: ['Observation', 'DiagnosticReport']
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(0);
        });

        it('should accept single resource type in array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                base: ['Patient']
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(0);
        });

        it('should accept missing base field', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(0);
        });

        it('should reject non-array base', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                base: 'Patient'
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(1);
            expect(baseErrors[0].constraints).toHaveProperty('isArray');
        });

        it('should reject non-string elements in base array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                base: ['Patient', 123, 'Practitioner']
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(1);
            expect(baseErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Code Field Validation', () => {
        it('should accept valid code', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                code: 'name'
            });

            const errors = await validate(dto);
            const codeErrors = errors.filter(error => error.property === 'code');

            expect(codeErrors).toHaveLength(0);
        });

        it('should accept updated code', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                code: 'identifier'
            });

            const errors = await validate(dto);
            const codeErrors = errors.filter(error => error.property === 'code');

            expect(codeErrors).toHaveLength(0);
        });

        it('should accept missing code field', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            const codeErrors = errors.filter(error => error.property === 'code');

            expect(codeErrors).toHaveLength(0);
        });

        it('should reject non-string code', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                code: 789
            });

            const errors = await validate(dto);
            const codeErrors = errors.filter(error => error.property === 'code');

            expect(codeErrors).toHaveLength(1);
            expect(codeErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Optional String Fields', () => {
        const optionalStringFields = ['version', 'derivedFrom', 'publisher', 'description', 'purpose', 'expression', 'xpath'];

        optionalStringFields.forEach(field => {
            it(`should accept valid ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: 'valid-string-value'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {});

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-string ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: 123
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isString');
            });
        });
    });

    describe('Boolean Fields', () => {
        const booleanFields = ['experimental', 'multipleOr', 'multipleAnd'];

        booleanFields.forEach(field => {
            it(`should accept true for ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: true
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept false for ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: false
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {});

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-boolean ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: 'not-boolean'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isBoolean');
            });
        });
    });

    describe('Date Field Validation', () => {
        it('should accept valid date string', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                date: '2025-01-01T10:00:00Z'
            });

            const errors = await validate(dto);
            const dateErrors = errors.filter(error => error.property === 'date');

            expect(dateErrors).toHaveLength(0);
        });

        it('should accept ISO 8601 date formats', async () => {
            const validDates = [
                '2025-01-01T10:00:00Z',
                '2025-01-01T10:00:00.000Z',
                '2025-01-01T10:00:00+02:00',
                '2025-01-01T10:00:00-05:00'
            ];

            for (const dateString of validDates) {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    date: dateString
                });

                const errors = await validate(dto);
                const dateErrors = errors.filter(error => error.property === 'date');

                expect(dateErrors).toHaveLength(0);
            }
        });

        it('should reject invalid date string', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                date: 'invalid-date'
            });

            const errors = await validate(dto);
            const dateErrors = errors.filter(error => error.property === 'date');

            expect(dateErrors).toHaveLength(1);
            expect(dateErrors[0].constraints).toHaveProperty('isDateString');
        });
    });

    describe('Enum Fields', () => {
        it('should accept valid XPathUsage', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                xpathUsage: XPathUsage.NORMAL
            });

            const errors = await validate(dto);
            const xpathErrors = errors.filter(error => error.property === 'xpathUsage');

            expect(xpathErrors).toHaveLength(0);
        });

        it('should accept valid comparator array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                comparator: [SearchComparator.EQ, SearchComparator.NE]
            });

            const errors = await validate(dto);
            const comparatorErrors = errors.filter(error => error.property === 'comparator');

            expect(comparatorErrors).toHaveLength(0);
        });

        it('should accept valid modifier array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS]
            });

            const errors = await validate(dto);
            const modifierErrors = errors.filter(error => error.property === 'modifier');

            expect(modifierErrors).toHaveLength(0);
        });
    });

    describe('Array Fields', () => {
        const objectArrayFields = ['contact', 'useContext', 'jurisdiction', 'extension', 'modifierExtension'];
        const stringArrayFields = ['target', 'chain'];

        objectArrayFields.forEach(field => {
            it(`should accept valid ${field} array`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: [{test: 'value'}]
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept empty ${field} array`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: []
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-array ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: 'not-an-array'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isArray');
            });
        });

        stringArrayFields.forEach(field => {
            it(`should accept valid ${field} array`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: ['Patient', 'Practitioner']
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept empty ${field} array`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: []
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-array ${field}`, async () => {
                const dto = plainToInstance(UpdateSearchParameterDto, {
                    [field]: 'not-an-array'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isArray');
            });
        });
    });

    describe('Component Field Validation', () => {
        it('should accept valid component array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                component: [{
                    definition: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                    expression: 'family | given'
                }]
            });

            const errors = await validate(dto);
            const componentErrors = errors.filter(error => error.property === 'component');

            expect(componentErrors).toHaveLength(0);
        });

        it('should accept updated component array', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                component: [
                    {
                        definition: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                        expression: 'family'
                    },
                    {
                        definition: 'http://hl7.org/fhir/SearchParameter/Patient-given',
                        expression: 'given'
                    }
                ]
            });

            const errors = await validate(dto);
            const componentErrors = errors.filter(error => error.property === 'component');

            expect(componentErrors).toHaveLength(0);
        });
    });

    describe('Complete Update Examples', () => {
        it('should validate minimal status update', async () => {
            const statusUpdate = {
                status: SearchParameterStatus.ACTIVE
            };

            const dto = plainToInstance(UpdateSearchParameterDto, statusUpdate);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate comprehensive SearchParameter update', async () => {
            const comprehensiveUpdate = {
                status: SearchParameterStatus.ACTIVE,
                description: 'Updated description for patient name search',
                expression: 'Patient.name.family | Patient.name.given',
                xpath: 'f:Patient/f:name/f:family | f:Patient/f:name/f:given',
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS, SearchModifier.MISSING],
                multipleOr: true,
                multipleAnd: false,
                date: '2025-01-15T14:30:00Z',
                publisher: 'Updated Healthcare Organization',
                purpose: 'Enhanced search capabilities for patient names'
            };

            const dto = plainToInstance(UpdateSearchParameterDto, comprehensiveUpdate);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate expression refinement update', async () => {
            const expressionUpdate = {
                expression: 'Patient.name.where(use != "temp")',
                description: 'Refined to exclude temporary names',
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS]
            };

            const dto = plainToInstance(UpdateSearchParameterDto, expressionUpdate);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate base resource expansion', async () => {
            const baseExpansion = {
                base: ['Patient', 'Practitioner', 'RelatedPerson'],
                description: 'Extended to support practitioner and related person names',
                purpose: 'Unified name search across person-like resources'
            };

            const dto = plainToInstance(UpdateSearchParameterDto, baseExpansion);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate retirement update', async () => {
            const retirementUpdate = {
                status: SearchParameterStatus.RETIRED,
                description: 'Deprecated in favor of new unified search parameter',
                purpose: 'Legacy parameter - use unified-name instead'
            };

            const dto = plainToInstance(UpdateSearchParameterDto, retirementUpdate);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate empty update object', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Real-world Update Scenarios', () => {
        it('should validate modifier enhancement', async () => {
            const modifierUpdate = {
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS, SearchModifier.MISSING, SearchModifier.TEXT],
                description: 'Added text search and missing value support',
                multipleOr: true
            };

            const dto = plainToInstance(UpdateSearchParameterDto, modifierUpdate);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate expression optimization', async () => {
            const expressionOptimization = {
                expression: 'Patient.name.family | Patient.name.given | Patient.name.prefix | Patient.name.suffix',
                xpath: 'f:Patient/f:name/f:family | f:Patient/f:name/f:given | f:Patient/f:name/f:prefix | f:Patient/f:name/f:suffix',
                description: 'Optimized to include all name components for comprehensive search'
            };

            const dto = plainToInstance(UpdateSearchParameterDto, expressionOptimization);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate publisher transfer', async () => {
            const publisherTransfer = {
                publisher: 'New Healthcare Standards Organization',
                contact: [{
                    telecom: [{
                        system: 'email',
                        value: 'support@new-org.com'
                    }]
                }],
                date: '2025-02-01T00:00:00Z'
            };

            const dto = plainToInstance(UpdateSearchParameterDto, publisherTransfer);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                url: 123, // Non-string
                name: 456, // Non-string
                status: 'invalid-status', // Invalid enum
                type: 'invalid-type', // Invalid enum
                code: 789, // Non-string
                base: 'Patient', // Should be array
                expression: 101112, // Non-string
                experimental: 'not-boolean', // Non-boolean
                date: 'invalid-date' // Invalid date
            };

            const dto = plainToInstance(UpdateSearchParameterDto, invalidData);
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.url).toBeDefined();
            expect(errorsByProperty.name).toBeDefined();
            expect(errorsByProperty.status).toBeDefined();
            expect(errorsByProperty.type).toBeDefined();
            expect(errorsByProperty.code).toBeDefined();
            expect(errorsByProperty.base).toBeDefined();
        });

        it('should handle all null values', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: null,
                name: null,
                status: null,
                type: null,
                code: null,
                base: null,
                expression: null,
                experimental: null,
                date: null
            });

            const errors = await validate(dto);

            // All fields are optional, so null should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle undefined values', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: undefined,
                name: undefined,
                status: undefined,
                type: undefined,
                code: undefined,
                base: undefined,
                expression: undefined
            });

            const errors = await validate(dto);

            // All fields are optional, so undefined should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should reject boolean values for string fields', async () => {
            const dto = plainToInstance(UpdateSearchParameterDto, {
                url: true, // Boolean instead of string
                name: false, // Boolean instead of string
                expression: true // Boolean instead of string
            });

            const errors = await validate(dto);

            const urlErrors = errors.filter(error => error.property === 'url');
            const nameErrors = errors.filter(error => error.property === 'name');
            const expressionErrors = errors.filter(error => error.property === 'expression');

            expect(urlErrors).toHaveLength(1);
            expect(urlErrors[0].constraints).toHaveProperty('isString');
            expect(nameErrors).toHaveLength(1);
            expect(nameErrors[0].constraints).toHaveProperty('isString');
            expect(expressionErrors).toHaveLength(1);
            expect(expressionErrors[0].constraints).toHaveProperty('isString');
        });
    });
});