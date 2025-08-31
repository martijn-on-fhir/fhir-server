import { validate } from 'class-validator';
import { CreateValueSetDto } from './create-value-set-dto';

describe('CreateValueSetDto', () => {
  let dto: CreateValueSetDto;

  beforeEach(() => {
    dto = new CreateValueSetDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should have default values', () => {
    expect(dto.resourceType).toBe('ValueSet');
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/administrative-gender';
      dto.expansion = [
        {
          system: 'http://hl7.org/fhir/administrative-gender',
          code: 'male',
          display: 'Male'
        },
        {
          system: 'http://hl7.org/fhir/administrative-gender',
          code: 'female',
          display: 'Female'
        }
      ];
      dto.value = {
        resourceType: 'ValueSet',
        id: 'administrative-gender',
        url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
        name: 'AdministrativeGender',
        status: 'active'
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when url is missing', async () => {
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('url');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when url is not a string', async () => {
      (dto as any).url = 123;
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('url');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when expansion is missing', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('expansion');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when expansion is not an array', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      (dto as any).expansion = 'invalid';
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('expansion');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when value is missing', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.expansion = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation when value is not an object', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.expansion = [];
      (dto as any).value = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation when resourceType is not a string', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };
      (dto as any).resourceType = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('resourceType');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with complex expansion and value objects', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/complex';
      dto.expansion = [
        {
          system: 'http://snomed.info/sct',
          code: '271649006',
          display: 'Systolic blood pressure',
          contains: [
            {
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }
          ]
        }
      ];
      dto.value = {
        resourceType: 'ValueSet',
        id: 'complex',
        url: 'http://hl7.org/fhir/ValueSet/complex',
        name: 'ComplexValueSet',
        title: 'Complex Value Set Example',
        status: 'active',
        compose: {
          include: [
            {
              system: 'http://snomed.info/sct',
              concept: [
                {
                  code: '271649006',
                  display: 'Systolic blood pressure'
                }
              ]
            }
          ]
        }
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty expansion array', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/empty';
      dto.expansion = [];
      dto.value = {
        resourceType: 'ValueSet',
        id: 'empty',
        status: 'draft'
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal value object', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/minimal';
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('properties', () => {
    it('should accept valid URL formats', async () => {
      const validUrls = [
        'http://hl7.org/fhir/ValueSet/administrative-gender',
        'https://example.com/fhir/ValueSet/custom-codes',
        'http://terminology.hl7.org/ValueSet/v3-ActCode'
      ];

      for (const url of validUrls) {
        dto.url = url;
        dto.expansion = [];
        dto.value = { resourceType: 'ValueSet' };
        
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle optional resourceType field', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };
      dto.resourceType = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept custom resourceType values', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/test';
      dto.expansion = [];
      dto.value = { resourceType: 'ValueSet' };
      dto.resourceType = 'CustomValueSet';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.resourceType).toBe('CustomValueSet');
    });

    it('should handle complex nested expansion objects', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/nested';
      dto.expansion = [
        {
          system: 'http://example.com/codes',
          code: 'parent',
          display: 'Parent Code',
          contains: [
            {
              system: 'http://example.com/codes',
              code: 'child1',
              display: 'Child Code 1'
            },
            {
              system: 'http://example.com/codes',
              code: 'child2',
              display: 'Child Code 2',
              inactive: true
            }
          ]
        }
      ];
      dto.value = { resourceType: 'ValueSet' };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});