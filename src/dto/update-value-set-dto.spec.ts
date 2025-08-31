import { validate } from 'class-validator';
import { UpdateValueSetDto } from './update-value-set-dto';

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

    it('should pass validation with only expansion provided', async () => {
      dto.expansion = [
        {
          system: 'http://hl7.org/fhir/administrative-gender',
          code: 'unknown',
          display: 'Unknown'
        }
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only value provided', async () => {
      dto.value = {
        resourceType: 'ValueSet',
        id: 'updated-set',
        name: 'UpdatedSet',
        status: 'draft'
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only resourceType provided', async () => {
      dto.resourceType = 'UpdatedValueSet';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all fields provided', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/complete-update';
      dto.resourceType = 'ValueSet';
      dto.expansion = [
        {
          system: 'http://example.com',
          code: 'test',
          display: 'Test Code'
        }
      ];
      dto.value = {
        resourceType: 'ValueSet',
        id: 'complete-update',
        name: 'CompleteUpdate',
        status: 'active'
      };

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

    it('should fail validation when expansion is not an array', async () => {
      (dto as any).expansion = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('expansion');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when value is not an object', async () => {
      (dto as any).value = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation when resourceType is not a string', async () => {
      (dto as any).resourceType = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('resourceType');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with partial complex objects', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/partial-update';
      dto.expansion = [
        {
          system: 'http://snomed.info/sct',
          code: '12345',
          display: 'New Concept',
          abstract: false,
          version: '2023-01'
        }
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with nested value object updates', async () => {
      dto.value = {
        resourceType: 'ValueSet',
        compose: {
          include: [
            {
              system: 'http://example.com',
              concept: [
                {
                  code: 'new-code',
                  display: 'New Code Display'
                }
              ]
            }
          ],
          exclude: [
            {
              system: 'http://example.com',
              concept: [
                {
                  code: 'old-code',
                  display: 'Deprecated Code'
                }
              ]
            }
          ]
        }
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('partial type behavior', () => {
    it('should inherit validation from CreateValueSetDto', async () => {
      (dto as any).url = [];
      (dto as any).expansion = 'not an array';
      (dto as any).value = 'not an object';

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);

      const urlError = errors.find(error => error.property === 'url');
      const expansionError = errors.find(error => error.property === 'expansion');
      const valueError = errors.find(error => error.property === 'value');

      expect(urlError?.constraints).toHaveProperty('isString');
      expect(expansionError?.constraints).toHaveProperty('isArray');
      expect(valueError?.constraints).toHaveProperty('isObject');
    });

    it('should allow undefined values for all properties', async () => {
      dto.url = undefined;
      dto.resourceType = undefined;
      dto.expansion = undefined;
      dto.value = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should maintain type safety for valid partial updates', () => {
      dto.url = 'http://example.com/ValueSet/test';
      dto.expansion = [{ system: 'test', code: 'test', display: 'test' }];
      dto.value = { resourceType: 'ValueSet' };
      dto.resourceType = 'ValueSet';

      expect(dto.url).toBe('http://example.com/ValueSet/test');
      expect(dto.expansion).toHaveLength(1);
      expect(dto.value.resourceType).toBe('ValueSet');
      expect(dto.resourceType).toBe('ValueSet');
    });
  });

  describe('use cases', () => {
    it('should support URL-only updates', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/new-url';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.url).toBe('http://hl7.org/fhir/ValueSet/new-url');
    });

    it('should support expansion-only updates', async () => {
      dto.expansion = [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'M',
          display: 'Married'
        },
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'S',
          display: 'Single'
        }
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.expansion).toHaveLength(2);
    });

    it('should support value-only updates', async () => {
      dto.value = {
        resourceType: 'ValueSet',
        id: 'marital-status',
        name: 'MaritalStatus',
        title: 'Marital Status Codes',
        status: 'active',
        description: 'Codes representing marital status'
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.value.name).toBe('MaritalStatus');
      expect(dto.value.status).toBe('active');
    });

    it('should support mixed partial updates', async () => {
      dto.url = 'http://hl7.org/fhir/ValueSet/mixed-update';
      dto.resourceType = 'CustomValueSet';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.url).toBe('http://hl7.org/fhir/ValueSet/mixed-update');
      expect(dto.resourceType).toBe('CustomValueSet');
      expect(dto.expansion).toBeUndefined();
      expect(dto.value).toBeUndefined();
    });

    it('should handle empty arrays and objects in updates', async () => {
      dto.expansion = [];
      dto.value = {};

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.expansion).toHaveLength(0);
      expect(Object.keys(dto.value)).toHaveLength(0);
    });
  });
});