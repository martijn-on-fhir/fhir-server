import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FhirSearchParamsDto } from './fhir-search-params-dto';

describe('FhirSearchParamsDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(FhirSearchParamsDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new FhirSearchParamsDto();
            expect(dto).toBeInstanceOf(FhirSearchParamsDto);
        });

        it('should have all optional fields', () => {
            const dto = new FhirSearchParamsDto();
            expect(dto._include).toBeUndefined();
            expect(dto._revinclude).toBeUndefined();
            expect(dto._include_all).toBeUndefined();
            expect(dto._count).toBeUndefined();
            expect(dto._offset).toBeUndefined();
            expect(dto._elements).toBeUndefined();
            expect(dto._summary).toBeUndefined();
        });
    });

    describe('_include Field Validation', () => {
        it('should accept valid _include array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: ['Patient:general-practitioner', 'Patient:organization']
            });

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(0);
        });

        it('should transform single string to array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: 'Patient:general-practitioner'
            });

            expect(Array.isArray(dto._include)).toBe(true);
            expect(dto._include).toEqual(['Patient:general-practitioner']);

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(0);
        });

        it('should accept multiple include references', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: [
                    'Patient:general-practitioner',
                    'Patient:organization',
                    'Encounter:patient',
                    'Observation:subject'
                ]
            });

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(0);
        });

        it('should accept empty _include array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: []
            });

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(0);
        });

        it('should accept missing _include field', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(0);
        });

        it('should reject non-string elements in _include array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: ['Patient:general-practitioner', 123, 'Patient:organization']
            });

            const errors = await validate(dto);
            const includeErrors = errors.filter(error => error.property === '_include');
            
            expect(includeErrors).toHaveLength(1);
            expect(includeErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('_revinclude Field Validation', () => {
        it('should accept valid _revinclude array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _revinclude: ['Observation:patient', 'Encounter:patient']
            });

            const errors = await validate(dto);
            const revincludeErrors = errors.filter(error => error.property === '_revinclude');
            
            expect(revincludeErrors).toHaveLength(0);
        });

        it('should transform single string to array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _revinclude: 'Observation:patient'
            });

            expect(Array.isArray(dto._revinclude)).toBe(true);
            expect(dto._revinclude).toEqual(['Observation:patient']);

            const errors = await validate(dto);
            const revincludeErrors = errors.filter(error => error.property === '_revinclude');
            
            expect(revincludeErrors).toHaveLength(0);
        });

        it('should accept multiple reverse include references', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _revinclude: [
                    'Observation:patient',
                    'Encounter:patient',
                    'DiagnosticReport:subject',
                    'MedicationRequest:patient'
                ]
            });

            const errors = await validate(dto);
            const revincludeErrors = errors.filter(error => error.property === '_revinclude');
            
            expect(revincludeErrors).toHaveLength(0);
        });

        it('should reject non-string elements in _revinclude array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _revinclude: ['Observation:patient', null, 'Encounter:patient']
            });

            const errors = await validate(dto);
            const revincludeErrors = errors.filter(error => error.property === '_revinclude');
            
            expect(revincludeErrors).toHaveLength(1);
            expect(revincludeErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('_include_all Field Validation', () => {
        it('should accept wildcard include all', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include_all: '*'
            });

            const errors = await validate(dto);
            const includeAllErrors = errors.filter(error => error.property === '_include_all');
            
            expect(includeAllErrors).toHaveLength(0);
        });

        it('should accept custom include all values', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include_all: 'Patient:*'
            });

            const errors = await validate(dto);
            const includeAllErrors = errors.filter(error => error.property === '_include_all');
            
            expect(includeAllErrors).toHaveLength(0);
        });

        it('should accept missing _include_all field', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            const includeAllErrors = errors.filter(error => error.property === '_include_all');
            
            expect(includeAllErrors).toHaveLength(0);
        });

        it('should reject non-string _include_all', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include_all: 123
            });

            const errors = await validate(dto);
            const includeAllErrors = errors.filter(error => error.property === '_include_all');
            
            expect(includeAllErrors).toHaveLength(1);
            expect(includeAllErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('_count Field Validation', () => {
        it('should accept valid count string', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: '50'
            });

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(0);
        });

        it('should accept zero count', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: '0'
            });

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(0);
        });

        it('should accept large count values', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: '1000'
            });

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(0);
        });

        it('should accept missing _count field', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(0);
        });

        it('should reject non-numeric string count', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: 'not-a-number'
            });

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(1);
            expect(countErrors[0].constraints).toHaveProperty('isNumberString');
        });

        it('should reject actual number (not string)', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: 50
            });

            const errors = await validate(dto);
            const countErrors = errors.filter(error => error.property === '_count');
            
            expect(countErrors).toHaveLength(1);
            expect(countErrors[0].constraints).toHaveProperty('isNumberString');
        });
    });

    describe('_offset Field Validation', () => {
        it('should accept valid offset string', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _offset: '0'
            });

            const errors = await validate(dto);
            const offsetErrors = errors.filter(error => error.property === '_offset');
            
            expect(offsetErrors).toHaveLength(0);
        });

        it('should accept large offset values', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _offset: '500'
            });

            const errors = await validate(dto);
            const offsetErrors = errors.filter(error => error.property === '_offset');
            
            expect(offsetErrors).toHaveLength(0);
        });

        it('should accept missing _offset field', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            const offsetErrors = errors.filter(error => error.property === '_offset');
            
            expect(offsetErrors).toHaveLength(0);
        });

        it('should reject non-numeric string offset', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _offset: 'invalid-offset'
            });

            const errors = await validate(dto);
            const offsetErrors = errors.filter(error => error.property === '_offset');
            
            expect(offsetErrors).toHaveLength(1);
            expect(offsetErrors[0].constraints).toHaveProperty('isNumberString');
        });

        it('should reject actual number (not string)', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _offset: 100
            });

            const errors = await validate(dto);
            const offsetErrors = errors.filter(error => error.property === '_offset');
            
            expect(offsetErrors).toHaveLength(1);
            expect(offsetErrors[0].constraints).toHaveProperty('isNumberString');
        });
    });

    describe('_elements Field Validation', () => {
        it('should accept valid _elements array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: ['Patient.name', 'Patient.birthDate']
            });

            const errors = await validate(dto);
            const elementsErrors = errors.filter(error => error.property === '_elements');
            
            expect(elementsErrors).toHaveLength(0);
        });

        it('should transform single string to array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: 'Patient.name'
            });

            expect(Array.isArray(dto._elements)).toBe(true);
            expect(dto._elements).toEqual(['Patient.name']);

            const errors = await validate(dto);
            const elementsErrors = errors.filter(error => error.property === '_elements');
            
            expect(elementsErrors).toHaveLength(0);
        });

        it('should accept multiple element paths', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: [
                    'Patient.name',
                    'Patient.birthDate',
                    'Patient.gender',
                    'Patient.contact.name',
                    'Patient.identifier'
                ]
            });

            const errors = await validate(dto);
            const elementsErrors = errors.filter(error => error.property === '_elements');
            
            expect(elementsErrors).toHaveLength(0);
        });

        it('should accept empty _elements array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: []
            });

            const errors = await validate(dto);
            const elementsErrors = errors.filter(error => error.property === '_elements');
            
            expect(elementsErrors).toHaveLength(0);
        });

        it('should reject non-string elements in _elements array', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: ['Patient.name', 123, 'Patient.birthDate']
            });

            const errors = await validate(dto);
            const elementsErrors = errors.filter(error => error.property === '_elements');
            
            expect(elementsErrors).toHaveLength(1);
            expect(elementsErrors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('_summary Field Validation', () => {
        it('should accept all valid summary values', async () => {
            const validSummaryValues = ['true', 'text', 'data', 'count', 'false'];

            for (const summaryValue of validSummaryValues) {
                const dto = plainToInstance(FhirSearchParamsDto, {
                    _summary: summaryValue as any
                });

                const errors = await validate(dto);
                const summaryErrors = errors.filter(error => error.property === '_summary');
                
                expect(summaryErrors).toHaveLength(0);
            }
        });

        it('should accept missing _summary field', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            const summaryErrors = errors.filter(error => error.property === '_summary');
            
            expect(summaryErrors).toHaveLength(0);
        });

        it('should reject invalid summary values', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _summary: 'invalid-summary'
            });

            const errors = await validate(dto);
            const summaryErrors = errors.filter(error => error.property === '_summary');
            
            expect(summaryErrors).toHaveLength(1);
            expect(summaryErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should reject boolean summary values', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _summary: true
            });

            const errors = await validate(dto);
            const summaryErrors = errors.filter(error => error.property === '_summary');
            
            expect(summaryErrors).toHaveLength(1);
            expect(summaryErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Complete Search Parameter Examples', () => {
        it('should validate minimal search params', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _count: '20'
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate complete search params', async () => {
            const completeParams = {
                _include: ['Patient:general-practitioner', 'Patient:organization'],
                _revinclude: ['Observation:patient', 'Encounter:patient'],
                _include_all: '*',
                _count: '50',
                _offset: '0',
                _elements: ['Patient.name', 'Patient.birthDate', 'Patient.gender'],
                _summary: 'true'
            };

            const dto = plainToInstance(FhirSearchParamsDto, completeParams);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate patient search with includes', async () => {
            const patientSearch = {
                _include: [
                    'Patient:general-practitioner',
                    'Patient:organization',
                    'Patient:link'
                ],
                _revinclude: [
                    'Observation:patient',
                    'Encounter:patient',
                    'MedicationRequest:patient'
                ],
                _count: '100',
                _elements: [
                    'Patient.name',
                    'Patient.birthDate',
                    'Patient.gender',
                    'Patient.active'
                ]
            };

            const dto = plainToInstance(FhirSearchParamsDto, patientSearch);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate observation search with summary', async () => {
            const observationSearch = {
                _include: ['Observation:patient', 'Observation:encounter'],
                _count: '25',
                _offset: '50',
                _summary: 'data'
            };

            const dto = plainToInstance(FhirSearchParamsDto, observationSearch);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate count-only search', async () => {
            const countSearch = {
                _summary: 'count'
            };

            const dto = plainToInstance(FhirSearchParamsDto, countSearch);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate empty search params', async () => {
            const dto = plainToInstance(FhirSearchParamsDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Transform Behavior', () => {
        it('should transform single string _include to array', () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: 'Patient:organization'
            });

            expect(Array.isArray(dto._include)).toBe(true);
            expect(dto._include).toEqual(['Patient:organization']);
        });

        it('should keep array _include as array', () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _include: ['Patient:organization', 'Patient:general-practitioner']
            });

            expect(Array.isArray(dto._include)).toBe(true);
            expect(dto._include).toEqual(['Patient:organization', 'Patient:general-practitioner']);
        });

        it('should transform single string _revinclude to array', () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _revinclude: 'Observation:patient'
            });

            expect(Array.isArray(dto._revinclude)).toBe(true);
            expect(dto._revinclude).toEqual(['Observation:patient']);
        });

        it('should transform single string _elements to array', () => {
            const dto = plainToInstance(FhirSearchParamsDto, {
                _elements: 'Patient.name'
            });

            expect(Array.isArray(dto._elements)).toBe(true);
            expect(dto._elements).toEqual(['Patient.name']);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                _include: ['valid-include', 123], // Mixed types
                _revinclude: [null, 'valid-revinclude'], // Null element
                _count: 'not-a-number', // Invalid number string
                _offset: true, // Boolean instead of string
                _elements: ['valid-element', false], // Mixed types
                _summary: 'invalid-summary' // Invalid enum
            };

            const dto = plainToInstance(FhirSearchParamsDto, invalidData);
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty._include).toBeDefined();
            expect(errorsByProperty._revinclude).toBeDefined();
            expect(errorsByProperty._count).toBeDefined();
            expect(errorsByProperty._offset).toBeDefined();
            expect(errorsByProperty._elements).toBeDefined();
            expect(errorsByProperty._summary).toBeDefined();
        });
    })
});