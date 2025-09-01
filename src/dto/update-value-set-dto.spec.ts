import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateValueSetDto } from './update-value-set-dto';
import { ValueSetStatus } from '../schema/value-set.schema';

/**
 * Validates UpdateValueSetDto class for FHIR ValueSet partial updates
 * Tests optional field validation, partial update scenarios, and type inheritance from CreateValueSetDto
 */
describe('UpdateValueSetDto', () => {
  let dto: UpdateValueSetDto;

  beforeEach(() => {
    dto = new UpdateValueSetDto();
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
      dto.url = 'http://hl7.org/fhir/ValueSet/updated-gender';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only status provided', async () => {
      dto.status = ValueSetStatus.DRAFT;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only name provided', async () => {
      dto.name = 'UpdatedValueSet';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only title provided', async () => {
      dto.title = 'Updated Value Set';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only description provided', async () => {
      dto.description = 'Updated description for the value set';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with compose provided', async () => {
      const dtoData = {
        compose: {
          include: [{
            system: 'http://hl7.org/fhir/administrative-gender',
            concept: [
              { code: 'male', display: 'Male' },
              { code: 'female', display: 'Female' }
            ]
          }]
        }
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all main fields provided', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/complete-update';
      dto.name = 'CompleteUpdate';
      dto.title = 'Complete Update Value Set';
      dto.status = ValueSetStatus.ACTIVE;
      dto.description = 'A complete update test';
      dto.publisher = 'Test Publisher';
      dto.version = '2.0.0';

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

    it('should fail validation when status is invalid', async () => {
      (dto as any).status = 'invalid-status';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when name is not a string', async () => {
      (dto as any).name = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when title is not a string', async () => {
      (dto as any).title = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when description is not a string', async () => {
      (dto as any).description = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with valid date string', async () => {
      dto.date = '2023-12-01T00:00:00.000Z';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when date is invalid format', async () => {
      (dto as any).date = 'invalid-date';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('date');
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('should pass validation with boolean fields', async () => {
      dto.experimental = true;
      dto.immutable = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when experimental is not boolean', async () => {
      (dto as any).experimental = 'yes';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('experimental');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should pass validation with contact details', async () => {
      const dtoData = {
        contact: [{
          name: 'Test Contact',
          telecom: ['http://example.com/contact']
        }]
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with identifier array', async () => {
      const dtoData = {
        identifier: [{
          use: 'official',
          system: 'http://example.com/identifiers',
          value: 'VS-001'
        }]
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with complex compose structure', async () => {
      const dtoData = {
        compose: {
          lockedDate: '2023-01-01',
          inactive: false,
          include: [{
            system: 'http://snomed.info/sct',
            version: '2023-03',
            concept: [
              { code: '12345', display: 'Test Concept' }
            ],
            filter: [{
              property: 'concept',
              op: 'is-a',
              value: 'TestValue'
            }]
          }],
          exclude: [{
            system: 'http://snomed.info/sct',
            concept: [
              { code: '67890', display: 'Excluded Concept' }
            ]
          }]
        }
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
    });
  });

  /** Tests that UpdateValueSetDto behaves as Partial<CreateValueSetDto> */
  describe('partial type behavior', () => {
    it('should inherit validation from CreateValueSetDto', async () => {
      (dto as any).url = 123;
      (dto as any).status = 'invalid';
      (dto as any).name = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);

      const urlError = errors.find(error => error.property === 'url');
      const statusError = errors.find(error => error.property === 'status');
      const nameError = errors.find(error => error.property === 'name');

      expect(urlError?.constraints).toHaveProperty('isString');
      expect(statusError?.constraints).toHaveProperty('isEnum');
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should allow undefined values for all properties', async () => {
      dto.url = undefined;
      dto.name = undefined;
      dto.title = undefined;
      dto.status = undefined;
      dto.description = undefined;
      dto.compose = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should maintain type safety for valid partial updates', () => {
      dto.url = 'http://example.com/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.name = 'TestValueSet';
      dto.title = 'Test Value Set';

      expect(dto.url).toBe('http://example.com/ValueSet/test');
      expect(dto.status).toBe(ValueSetStatus.ACTIVE);
      expect(dto.name).toBe('TestValueSet');
      expect(dto.title).toBe('Test Value Set');
    });
  });

  /** Tests common FHIR ValueSet update scenarios */
  describe('use cases', () => {
    it('should support URL-only updates', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/new-url';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.url).toBe('http://hl7.org/fhir/ValueSet/new-url');
    });

    it('should support status-only updates', async () => {
      dto.status = ValueSetStatus.RETIRED;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.status).toBe(ValueSetStatus.RETIRED);
    });

    it('should support metadata updates', async () => {
      dto.name = 'UpdatedValueSet';
      dto.title = 'Updated Value Set';
      dto.description = 'An updated description';
      dto.publisher = 'Updated Publisher';
      dto.version = '2.1.0';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('UpdatedValueSet');
      expect(dto.title).toBe('Updated Value Set');
      expect(dto.description).toBe('An updated description');
      expect(dto.publisher).toBe('Updated Publisher');
      expect(dto.version).toBe('2.1.0');
    });

    it('should support compose-only updates', async () => {
      const dtoData = {
        compose: {
          include: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            concept: [
              { code: 'M', display: 'Married' },
              { code: 'S', display: 'Single' }
            ]
          }]
        }
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
      expect(validDto.compose?.include).toHaveLength(1);
      expect(validDto.compose?.include?.[0].concept).toHaveLength(2);
    });

    it('should support mixed partial updates', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/mixed-update';
      dto.status = ValueSetStatus.DRAFT;
      dto.experimental = true;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.url).toBe('http://hl7.org/fhir/ValueSet/mixed-update');
      expect(dto.status).toBe(ValueSetStatus.DRAFT);
      expect(dto.experimental).toBe(true);
      expect(dto.name).toBeUndefined();
      expect(dto.compose).toBeUndefined();
    });

    it('should support date and copyright updates', async () => {
      dto.date = '2023-12-01T00:00:00.000Z';
      dto.copyright = 'Updated copyright notice';
      dto.purpose = 'Updated purpose statement';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.date).toBe('2023-12-01T00:00:00.000Z');
      expect(dto.copyright).toBe('Updated copyright notice');
      expect(dto.purpose).toBe('Updated purpose statement');
    });

    it('should handle empty objects and arrays in updates', async () => {
      dto.contact = [];
      dto.identifier = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.contact).toHaveLength(0);
      expect(dto.identifier).toHaveLength(0);
    });

    it('should support comprehensive updates', async () => {
      const dtoData = {
        url: 'http://hl7.org/fhir/ValueSet/comprehensive-update',
        name: 'ComprehensiveUpdate',
        title: 'Comprehensive Update Test',
        status: ValueSetStatus.ACTIVE,
        experimental: false,
        date: '2023-12-01T00:00:00.000Z',
        publisher: 'Test Organization',
        contact: [{
          name: 'Test Team',
          telecom: ['mailto:test@example.com']
        }],
        description: 'A comprehensive test of update functionality',
        immutable: false,
        purpose: 'Testing comprehensive updates',
        copyright: '© 2023 Test Organization',
        compose: {
          include: [{
            system: 'http://test.com/codes',
            concept: [
              { code: 'test1', display: 'Test Code 1' },
              { code: 'test2', display: 'Test Code 2' }
            ]
          }]
        }
      };

      const validDto = plainToInstance(UpdateValueSetDto, dtoData);
      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
      expect(validDto.name).toBe('ComprehensiveUpdate');
      expect(validDto.status).toBe(ValueSetStatus.ACTIVE);
      expect(validDto.compose?.include).toHaveLength(1);
      expect(validDto.contact).toHaveLength(1);
    });
  });

  describe('enum validation', () => {
    it('should accept all valid ValueSetStatus values', async () => {
      const validStatuses = [
        ValueSetStatus.DRAFT,
        ValueSetStatus.ACTIVE,
        ValueSetStatus.RETIRED,
        ValueSetStatus.UNKNOWN
      ];

      for (const status of validStatuses) {
        dto = new UpdateValueSetDto();
        dto.status = status;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid status values', async () => {
      const invalidStatuses = ['published', 'deprecated', 'superseded'];

      for (const status of invalidStatuses) {
        dto = new UpdateValueSetDto();
        (dto as any).status = status;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('status');
        expect(errors[0].constraints).toHaveProperty('isEnum');
      }
    });
  });
});