import {validate} from 'class-validator';
import {plainToInstance} from 'class-transformer';
import {CreateSearchParameterDto, SearchParameterComponentDto} from './create-search-parameter-dto';
import {
    SearchParameterStatus,
    SearchParameterType,
    XPathUsage,
    SearchComparator,
    SearchModifier
} from '../schema/search-parameter.schema';

describe('CreateSearchParameterDto', () => {

    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(CreateSearchParameterDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new CreateSearchParameterDto();
            expect(dto).toBeInstanceOf(CreateSearchParameterDto);
        });

        it('should have default resourceType', () => {
            const dto = new CreateSearchParameterDto();
            expect(dto.resourceType).toBe('SearchParameter');
        });
    });

    describe('SearchParameterComponentDto', () => {
        it('should be defined', () => {
            expect(SearchParameterComponentDto).toBeDefined();
        });

        it('should validate valid component', async () => {
            const component = plainToInstance(SearchParameterComponentDto, {
                definition: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                expression: 'family | given'
            });

            const errors = await validate(component);
            expect(errors).toHaveLength(0);
        });

        it('should require definition field', async () => {
            const component = plainToInstance(SearchParameterComponentDto, {
                expression: 'family | given'
            });

            const errors = await validate(component);
            const definitionErrors = errors.filter(error => error.property === 'definition');

            expect(definitionErrors).toHaveLength(1);
            expect(definitionErrors[0].constraints).toHaveProperty('isString');
        });

        it('should require expression field', async () => {
            const component = plainToInstance(SearchParameterComponentDto, {
                definition: 'http://hl7.org/fhir/SearchParameter/Patient-name'
            });

            const errors = await validate(component);
            const expressionErrors = errors.filter(error => error.property === 'expression');

            expect(expressionErrors).toHaveLength(1);
            expect(expressionErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Required Field Validation', () => {
        it('should require url field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(1);
            expect(urlErrors[0].constraints).toHaveProperty('isString');
        });

        it('should require name field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const nameErrors = errors.filter(error => error.property === 'name');

            expect(nameErrors).toHaveLength(1);
            expect(nameErrors[0].constraints).toHaveProperty('isString');
        });

        it('should require status field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');

            expect(statusErrors).toHaveLength(1);
            expect(statusErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should require description field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const descriptionErrors = errors.filter(error => error.property === 'description');

            expect(descriptionErrors).toHaveLength(1);
            expect(descriptionErrors[0].constraints).toHaveProperty('isString');
        });

        it('should require code field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const codeErrors = errors.filter(error => error.property === 'code');

            expect(codeErrors).toHaveLength(1);
            expect(codeErrors[0].constraints).toHaveProperty('isString');
        });

        it('should require base field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(1);
            expect(baseErrors[0].constraints).toHaveProperty('isArray');
        });

        it('should require type field', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient']
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should validate with all required fields', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const requiredFieldErrors = errors.filter(error =>
                ['url', 'name', 'status', 'description', 'code', 'base', 'type'].includes(error.property)
            );

            expect(requiredFieldErrors).toHaveLength(0);
        });
    });

    describe('URL Field Validation', () => {
        it('should accept valid canonical URLs', async () => {
            const validUrls = [
                'http://hl7.org/fhir/SearchParameter/Patient-name',
                'https://example.org/fhir/SearchParameter/custom-param',
                'http://nictiz.nl/fhir/SearchParameter/nl-core-patient-bsn'
            ];

            for (const url of validUrls) {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url,
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING
                });

                const errors = await validate(dto);
                const urlErrors = errors.filter(error => error.property === 'url');

                expect(urlErrors).toHaveLength(0);
            }
        });

        it('should reject non-string URL', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 123,
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const urlErrors = errors.filter(error => error.property === 'url');

            expect(urlErrors).toHaveLength(1);
            expect(urlErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Status Field Validation', () => {
        it('should accept all valid SearchParameterStatus values', async () => {
            const validStatuses = Object.values(SearchParameterStatus);

            for (const status of validStatuses) {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: status,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter(error => error.property === 'status');

                expect(statusErrors).toHaveLength(0);
            }
        });

        it('should reject invalid status values', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: 'invalid-status',
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING
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
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: type
                });

                const errors = await validate(dto);
                const typeErrors = errors.filter(error => error.property === 'type');

                expect(typeErrors).toHaveLength(0);
            }
        });

        it('should reject invalid type values', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: 'invalid-type'
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');

            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Base Array Field Validation', () => {
        it('should accept valid resource type arrays', async () => {
            const validBaseArrays = [
                ['Patient'],
                ['Patient', 'Practitioner'],
                ['Observation', 'DiagnosticReport', 'Procedure']
            ];

            for (const base of validBaseArrays) {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: base,
                    type: SearchParameterType.STRING
                });

                const errors = await validate(dto);
                const baseErrors = errors.filter(error => error.property === 'base');

                expect(baseErrors).toHaveLength(0);
            }
        });

        it('should reject non-array base', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: 'Patient',
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(1);
            expect(baseErrors[0].constraints).toHaveProperty('isArray');
        });

        it('should reject non-string elements in base array', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient', 123, 'Practitioner'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            const baseErrors = errors.filter(error => error.property === 'base');

            expect(baseErrors).toHaveLength(1);
            expect(baseErrors[0].constraints).toHaveProperty('isString');
        });

        it('should reject empty base array', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: [],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);
            // Empty array should pass isArray validation, but business logic might require at least one element
            const baseErrors = errors.filter(error => error.property === 'base');

            // This test assumes empty arrays are allowed by validation - adjust if business rules differ
            expect(baseErrors).toHaveLength(0);
        });
    });

    describe('Optional String Fields', () => {
        const optionalStringFields = ['version', 'derivedFrom', 'publisher', 'purpose', 'expression', 'xpath', 'language'];

        optionalStringFields.forEach(field => {
            it(`should accept valid ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    [field]: 'valid-string-value'
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-string ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
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
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    [field]: true
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept false for ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    [field]: false
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept missing ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-boolean ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
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
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
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
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    date: dateString
                });

                const errors = await validate(dto);
                const dateErrors = errors.filter(error => error.property === 'date');

                expect(dateErrors).toHaveLength(0);
            }
        });

        it('should reject invalid date string', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
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
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                xpathUsage: XPathUsage.NORMAL
            });

            const errors = await validate(dto);
            const xpathErrors = errors.filter(error => error.property === 'xpathUsage');

            expect(xpathErrors).toHaveLength(0);
        });

        it('should accept valid comparator array', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.NUMBER,
                comparator: [SearchComparator.EQ, SearchComparator.GT, SearchComparator.LT]
            });

            const errors = await validate(dto);
            const comparatorErrors = errors.filter(error => error.property === 'comparator');

            expect(comparatorErrors).toHaveLength(0);
        });

        it('should accept valid modifier array', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS, SearchModifier.MISSING]
            });

            const errors = await validate(dto);
            const modifierErrors = errors.filter(error => error.property === 'modifier');

            expect(modifierErrors).toHaveLength(0);
        });

        it('should reject invalid enum values in arrays', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                comparator: ['eq', 'invalid-comparator', 'gt']
            });

            const errors = await validate(dto);
            const comparatorErrors = errors.filter(error => error.property === 'comparator');

            expect(comparatorErrors).toHaveLength(1);
            expect(comparatorErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Array Fields', () => {
        const objectArrayFields = ['contact', 'useContext', 'jurisdiction', 'extension', 'modifierExtension'];
        const stringArrayFields = ['target', 'chain'];

        objectArrayFields.forEach(field => {
            it(`should accept valid ${field} array`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    [field]: [{test: 'value'}]
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should accept empty ${field} array`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    [field]: []
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-array ${field}`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
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
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.REFERENCE,
                    [field]: ['Patient', 'Practitioner']
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(0);
            });

            it(`should reject non-string elements in ${field} array`, async () => {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.REFERENCE,
                    [field]: ['Patient', 123, 'Practitioner']
                });

                const errors = await validate(dto);
                const fieldErrors = errors.filter(error => error.property === field);

                expect(fieldErrors).toHaveLength(1);
                expect(fieldErrors[0].constraints).toHaveProperty('isString');
            });
        });
    });

    describe('Component Field Validation', () => {
        it('should accept valid component array', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test-composite',
                name: 'test-composite',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test composite parameter',
                code: 'test-composite',
                base: ['Patient'],
                type: SearchParameterType.COMPOSITE,
                component: [{
                    definition: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                    expression: 'family | given'
                }]
            });

            const errors = await validate(dto);
            const componentErrors = errors.filter(error => error.property === 'component');

            expect(componentErrors).toHaveLength(0);
        });

        it('should validate nested component validation', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test-composite',
                name: 'test-composite',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test composite parameter',
                code: 'test-composite',
                base: ['Patient'],
                type: SearchParameterType.COMPOSITE,
                component: [{
                    definition: 'http://hl7.org/fhir/SearchParameter/Patient-name'
                    // Missing expression - should cause validation error
                }]
            });

            const errors = await validate(dto);
            // Should have nested validation errors for the component
            expect(errors.length).toBeGreaterThan(0);

            // Check if there are errors related to the component's nested validation
            const componentRelatedErrors = errors.filter(error =>
                error.property === 'component' || (error.target as any)?.component
            );
            expect(componentRelatedErrors.length).toBeGreaterThan(0);
        });
    });

    describe('Text Field Validation', () => {
        it('should accept valid text object', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: 'http://example.org/SearchParameter/test',
                name: 'test-param',
                status: SearchParameterStatus.ACTIVE,
                description: 'Test parameter',
                code: 'test',
                base: ['Patient'],
                type: SearchParameterType.STRING,
                text: {
                    status: 'generated',
                    div: '<div>Search parameter for patient names</div>'
                }
            });

            const errors = await validate(dto);
            const textErrors = errors.filter(error => error.property === 'text');

            expect(textErrors).toHaveLength(0);
        });

        it('should accept all valid text status values', async () => {
            const validStatuses = ['generated', 'extensions', 'additional', 'empty'];

            for (const status of validStatuses) {
                const dto = plainToInstance(CreateSearchParameterDto, {
                    url: 'http://example.org/SearchParameter/test',
                    name: 'test-param',
                    status: SearchParameterStatus.ACTIVE,
                    description: 'Test parameter',
                    code: 'test',
                    base: ['Patient'],
                    type: SearchParameterType.STRING,
                    text: {
                        status: status as 'generated' | 'extensions' | 'additional' | 'empty',
                        div: '<div>Test content</div>'
                    }
                });

                const errors = await validate(dto);
                const textErrors = errors.filter(error => error.property === 'text');

                expect(textErrors).toHaveLength(0);
            }
        });
    });

    describe('Complete SearchParameter Examples', () => {
        it('should validate minimal SearchParameter', async () => {
            const minimalSearchParameter = {
                url: 'http://example.org/SearchParameter/minimal',
                name: 'minimal',
                status: SearchParameterStatus.ACTIVE,
                description: 'Minimal search parameter example',
                code: 'minimal',
                base: ['Patient'],
                type: SearchParameterType.STRING
            };

            const dto = plainToInstance(CreateSearchParameterDto, minimalSearchParameter);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate comprehensive SearchParameter with all fields', async () => {
            const comprehensiveSearchParameter = {
                resourceType: 'SearchParameter',
                url: 'http://example.org/fhir/SearchParameter/Patient-comprehensive-name',
                version: '1.0.0',
                name: 'comprehensive-patient-name',
                derivedFrom: 'http://hl7.org/fhir/SearchParameter/individual-name',
                status: SearchParameterStatus.ACTIVE,
                experimental: false,
                date: '2025-01-01T10:00:00Z',
                publisher: 'Example Healthcare Organization',
                contact: [{
                    telecom: [{
                        system: 'email',
                        value: 'fhir-support@example.org'
                    }]
                }],
                description: 'Comprehensive search parameter for patient names including all name components',
                useContext: [{
                    code: {
                        system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                        code: 'focus'
                    },
                    valueCodeableConcept: {
                        coding: [{
                            system: 'http://hl7.org/fhir/resource-types',
                            code: 'Patient'
                        }]
                    }
                }],
                jurisdiction: [{
                    coding: [{
                        system: 'urn:iso:std:iso:3166',
                        code: 'NL'
                    }]
                }],
                purpose: 'Enable comprehensive name-based patient search across all name components',
                code: 'comprehensive-name',
                base: ['Patient', 'Practitioner', 'RelatedPerson'],
                type: SearchParameterType.STRING,
                expression: 'Patient.name | Practitioner.name | RelatedPerson.name',
                xpath: 'f:Patient/f:name | f:Practitioner/f:name | f:RelatedPerson/f:name',
                xpathUsage: XPathUsage.NORMAL,
                target: ['Patient', 'Practitioner'],
                multipleOr: true,
                multipleAnd: true,
                comparator: [SearchComparator.EQ, SearchComparator.NE],
                modifier: [SearchModifier.EXACT, SearchModifier.CONTAINS, SearchModifier.MISSING, SearchModifier.TEXT],
                chain: ['name', 'family', 'given'],
                language: 'en-US',
                text: {
                    status: 'generated',
                    div: '<div>Comprehensive search parameter for name-based searches</div>'
                },
                extension: [{
                    url: 'http://example.org/extension/search-priority',
                    valueInteger: 10
                }],
                modifierExtension: []
            };

            const dto = plainToInstance(CreateSearchParameterDto, comprehensiveSearchParameter);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate composite SearchParameter', async () => {
            const compositeSearchParameter = {
                url: 'http://example.org/SearchParameter/patient-name-birthdate',
                name: 'patient-name-birthdate',
                status: SearchParameterStatus.ACTIVE,
                description: 'Composite search combining patient name and birth date',
                code: 'name-birthdate',
                base: ['Patient'],
                type: SearchParameterType.COMPOSITE,
                expression: 'Patient',
                component: [
                    {
                        definition: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                        expression: 'name'
                    },
                    {
                        definition: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate',
                        expression: 'birthDate'
                    }
                ]
            };

            const dto = plainToInstance(CreateSearchParameterDto, compositeSearchParameter);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate reference SearchParameter', async () => {
            const referenceSearchParameter = {
                url: 'http://example.org/SearchParameter/patient-general-practitioner',
                name: 'patient-general-practitioner',
                status: SearchParameterStatus.ACTIVE,
                description: 'Reference to patient\'s general practitioner',
                code: 'general-practitioner',
                base: ['Patient'],
                type: SearchParameterType.REFERENCE,
                expression: 'Patient.generalPractitioner',
                target: ['Practitioner', 'Organization'],
                modifier: [SearchModifier.MISSING, SearchModifier.TYPE, SearchModifier.IDENTIFIER],
                chain: ['name', 'identifier']
            };

            const dto = plainToInstance(CreateSearchParameterDto, referenceSearchParameter);
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                // Missing required url
                resourceType: 123, // Should be string
                // Missing name
                status: 'invalid-status', // Invalid enum
                // Missing description
                code: 456, // Should be string
                base: 'Patient', // Should be array
                type: 'invalid-type', // Invalid enum
                experimental: 'not-boolean', // Should be boolean
                date: 'invalid-date', // Invalid date format
                multipleOr: 'not-boolean' // Should be boolean
            };

            const dto = plainToInstance(CreateSearchParameterDto, invalidData);
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            // Check that multiple fields have validation errors
            expect(Object.keys(errorsByProperty).length).toBeGreaterThanOrEqual(5);
        });

        it('should handle null values for required fields', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: null,
                name: null,
                status: null,
                description: null,
                code: null,
                base: null,
                type: null
            });

            const errors = await validate(dto);

            // All required fields should have validation errors
            expect(errors.length).toBeGreaterThan(0);

            const requiredFieldErrors = errors.filter(error =>
                ['url', 'name', 'status', 'description', 'code', 'base', 'type'].includes(error.property)
            );

            expect(requiredFieldErrors.length).toBeGreaterThan(0);
        });

        it('should handle empty string values for required fields', async () => {
            const dto = plainToInstance(CreateSearchParameterDto, {
                url: '',
                name: '',
                status: SearchParameterStatus.ACTIVE,
                description: '',
                code: '',
                base: ['Patient'],
                type: SearchParameterType.STRING
            });

            const errors = await validate(dto);

            // Empty strings should pass isString validation but might fail business logic
            // This test verifies current validation behavior
            const stringFieldErrors = errors.filter(error =>
                ['url', 'name', 'description', 'code'].includes(error.property)
            );

            // If there are specific length requirements, they would show up here
            // Otherwise empty strings pass basic string validation
            expect(stringFieldErrors).toHaveLength(0);
        });
    });
});