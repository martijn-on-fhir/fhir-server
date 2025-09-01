import { validate } from 'class-validator';
import { CreateValueSetDto } from './create-value-set-dto';
import { ValueSetStatus } from '../schema/value-set.schema';

/**
 * Validates CreateValueSetDto class for FHIR ValueSet resource creation
 * Tests required fields (url, status), optional fields, and FHIR status enum validation
 */
describe('CreateValueSetDto', () => {
  let dto: CreateValueSetDto;

  beforeEach(() => {
    dto = new CreateValueSetDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  /** Tests required FHIR ValueSet fields (url, status) */
  describe('required field validation', () => {
    it('should pass validation with minimal required data', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/administrative-gender';
      dto.status = ValueSetStatus.ACTIVE;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when url is missing', async () => {
      dto.status = ValueSetStatus.ACTIVE;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const urlError = errors.find(error => error.property === 'url');
      expect(urlError).toBeDefined();
      expect(urlError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when url is not a string', async () => {
      (dto as any).url = 123;
      dto.status = ValueSetStatus.ACTIVE;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const urlError = errors.find(error => error.property === 'url');
      expect(urlError).toBeDefined();
      expect(urlError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when status is missing', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const statusError = errors.find(error => error.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is invalid', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      (dto as any).status = 'invalid-status';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const statusError = errors.find(error => error.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });
  });

  describe('optional field validation', () => {
    beforeEach(() => {
      // Set required fields
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
    });

    it('should fail validation when name is not a string', async () => {
      (dto as any).name = 123;

      const errors = await validate(dto);
      const nameError = errors.find(error => error.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when title is not a string', async () => {
      (dto as any).title = 123;

      const errors = await validate(dto);
      const titleError = errors.find(error => error.property === 'title');
      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when version is not a string', async () => {
      (dto as any).version = 123;

      const errors = await validate(dto);
      const versionError = errors.find(error => error.property === 'version');
      expect(versionError).toBeDefined();
      expect(versionError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when experimental is not a boolean', async () => {
      (dto as any).experimental = 'yes';

      const errors = await validate(dto);
      const experimentalError = errors.find(error => error.property === 'experimental');
      expect(experimentalError).toBeDefined();
      expect(experimentalError?.constraints).toHaveProperty('isBoolean');
    });

    it('should fail validation when date is invalid format', async () => {
      (dto as any).date = 'invalid-date';

      const errors = await validate(dto);
      const dateError = errors.find(error => error.property === 'date');
      expect(dateError).toBeDefined();
      expect(dateError?.constraints).toHaveProperty('isDateString');
    });

    it('should fail validation when publisher is not a string', async () => {
      (dto as any).publisher = 123;

      const errors = await validate(dto);
      const publisherError = errors.find(error => error.property === 'publisher');
      expect(publisherError).toBeDefined();
      expect(publisherError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when description is not a string', async () => {
      (dto as any).description = 123;

      const errors = await validate(dto);
      const descriptionError = errors.find(error => error.property === 'description');
      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when immutable is not a boolean', async () => {
      (dto as any).immutable = 'yes';

      const errors = await validate(dto);
      const immutableError = errors.find(error => error.property === 'immutable');
      expect(immutableError).toBeDefined();
      expect(immutableError?.constraints).toHaveProperty('isBoolean');
    });

    it('should fail validation when purpose is not a string', async () => {
      (dto as any).purpose = 123;

      const errors = await validate(dto);
      const purposeError = errors.find(error => error.property === 'purpose');
      expect(purposeError).toBeDefined();
      expect(purposeError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when copyright is not a string', async () => {
      (dto as any).copyright = 123;

      const errors = await validate(dto);
      const copyrightError = errors.find(error => error.property === 'copyright');
      expect(copyrightError).toBeDefined();
      expect(copyrightError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when identifier is not an array', async () => {
      (dto as any).identifier = 'invalid';

      const errors = await validate(dto);
      const identifierError = errors.find(error => error.property === 'identifier');
      expect(identifierError).toBeDefined();
      expect(identifierError?.constraints).toHaveProperty('isArray');
    });

    it('should fail validation when contact is not an array', async () => {
      (dto as any).contact = 'invalid';

      const errors = await validate(dto);
      const contactError = errors.find(error => error.property === 'contact');
      expect(contactError).toBeDefined();
      expect(contactError?.constraints).toHaveProperty('isArray');
    });
  });

  /** Tests FHIR ValueSetStatus enum validation */
  describe('enum validation', () => {
    beforeEach(() => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
    });

    it('should accept all valid ValueSetStatus values', async () => {
      const validStatuses = [
        ValueSetStatus.DRAFT,
        ValueSetStatus.ACTIVE,
        ValueSetStatus.RETIRED,
        ValueSetStatus.UNKNOWN
      ];

      for (const status of validStatuses) {
        dto.status = status;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid status values', async () => {
      const invalidStatuses = ['published', 'deprecated', 'superseded'];

      for (const status of invalidStatuses) {
        (dto as any).status = status;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        
        const statusError = errors.find(error => error.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      }
    });
  });

  describe('field combinations', () => {
    it('should pass validation with valid string fields', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/administrative-gender';
      dto.version = '4.0.1';
      dto.name = 'AdministrativeGender';
      dto.title = 'Administrative Gender';
      dto.status = ValueSetStatus.ACTIVE;
      dto.publisher = 'HL7 FHIR Project';
      dto.description = 'The gender of a person used for administrative purposes';
      dto.purpose = 'To provide standard gender codes for administrative use';
      dto.copyright = 'Copyright HL7. Licensed under creative commons public domain';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid boolean fields', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.experimental = false;
      dto.immutable = true;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid date', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.date = '2023-01-01T00:00:00.000Z';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty arrays', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.identifier = [];
      dto.contact = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.identifier).toHaveLength(0);
      expect(dto.contact).toHaveLength(0);
    });
  });

  /** Tests FHIR canonical URL formats */
  describe('url validation', () => {
    beforeEach(() => {
      dto.status = ValueSetStatus.ACTIVE;
    });

    it('should accept valid URL formats', async () => {
      const validUrls = [
        'http://hl7.org/fhir/ValueSet/administrative-gender',
        'https://example.com/fhir/ValueSet/custom-codes',
        'http://terminology.hl7.org/ValueSet/v3-ActCode',
        'urn:oid:2.16.840.1.113883.4.642.3.1'
      ];

      for (const url of validUrls) {
        dto.url = url;
        
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  /** Tests FHIR dateTime format validation */
  describe('date validation', () => {
    beforeEach(() => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
    });

    it('should accept valid date formats', async () => {
      const validDates = [
        '2023-01-01T00:00:00.000Z',
        '2023-12-31T23:59:59Z',
        '2023-06-15T12:30:45.123Z',
        '2019-11-01T09:29:23+11:00'
      ];

      for (const date of validDates) {
        dto.date = date;
        
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid date formats', async () => {
      const invalidDates = [
        'invalid-date',
        '2023-13-01',
        '2023/01/01',
        'Jan 1, 2023'
      ];

      for (const date of invalidDates) {
        (dto as any).date = date;
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        
        const dateError = errors.find(error => error.property === 'date');
        expect(dateError).toBeDefined();
        expect(dateError?.constraints).toHaveProperty('isDateString');
      }
    });
  });

  describe('optional fields behavior', () => {
    it('should pass validation when optional fields are undefined', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.version = undefined;
      dto.name = undefined;
      dto.title = undefined;
      dto.experimental = undefined;
      dto.date = undefined;
      dto.publisher = undefined;
      dto.contact = undefined;
      dto.description = undefined;
      dto.identifier = undefined;
      dto.purpose = undefined;
      dto.copyright = undefined;
      dto.immutable = undefined;
      dto.compose = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should maintain correct property values', () => {
      dto.url = 'http://example.com/ValueSet/test';
      dto.status = ValueSetStatus.DRAFT;
      dto.name = 'TestValueSet';
      dto.title = 'Test Value Set';
      dto.version = '1.0.0';
      dto.experimental = true;
      dto.immutable = false;

      expect(dto.url).toBe('http://example.com/ValueSet/test');
      expect(dto.status).toBe(ValueSetStatus.DRAFT);
      expect(dto.name).toBe('TestValueSet');
      expect(dto.title).toBe('Test Value Set');
      expect(dto.version).toBe('1.0.0');
      expect(dto.experimental).toBe(true);
      expect(dto.immutable).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple validation errors', async () => {
      (dto as any).url = 123; // Invalid type
      (dto as any).status = 'invalid'; // Invalid enum
      (dto as any).name = false; // Invalid type
      (dto as any).experimental = 'maybe'; // Invalid type

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Check that we have errors for each invalid field
      const urlError = errors.find(error => error.property === 'url');
      const statusError = errors.find(error => error.property === 'status');
      const nameError = errors.find(error => error.property === 'name');
      const experimentalError = errors.find(error => error.property === 'experimental');

      expect(urlError).toBeDefined();
      expect(statusError).toBeDefined();
      expect(nameError).toBeDefined();
      expect(experimentalError).toBeDefined();
    });

    it('should handle empty string values correctly', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.status = ValueSetStatus.ACTIVE;
      dto.name = '';
      dto.title = '';
      dto.description = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});