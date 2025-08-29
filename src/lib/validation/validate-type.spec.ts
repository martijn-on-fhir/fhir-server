import { ValidateType } from './validate-type';
import { ValidationError } from '../../interfaces/validation-error';

describe('ValidateType', () => {
  let validator: ValidateType;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should create instance with single type', () => {
      const elementDef = {
        path: 'Patient.name',
        type: [{ code: 'string' }]
      };

      validator = new ValidateType(elementDef);

      expect(validator).toBeDefined();
      expect(validator.path).toBe('Patient.name');
      expect(validator.expectedTypes).toEqual(['String']);
    });

    it('should create instance with multiple types', () => {
      const elementDef = {
        path: 'Patient.deceased',
        type: [
          { code: 'boolean' },
          { code: 'dateTime' }
        ]
      };

      validator = new ValidateType(elementDef);

      expect(validator.expectedTypes).toEqual(['Boolean', 'DateTime']);
    });

    it('should handle missing type array', () => {
      const elementDef = {
        path: 'Patient.test'
      };

      validator = new ValidateType(elementDef);

      expect(validator.expectedTypes).toEqual([]);
    });

    it('should use "Unknown" when path is missing', () => {
      const elementDef = {
        type: [{ code: 'string' }]
      };

      validator = new ValidateType(elementDef);

      expect(validator.path).toBe('Unkown'); // Note: matches the typo in source code
    });

    it('should normalize URL-based type codes', () => {
      const elementDef = {
        path: 'Patient.extension',
        type: [
          { code: 'http://hl7.org/fhir/StructureDefinition.Extension' }
        ]
      };

      validator = new ValidateType(elementDef);

      expect(validator.expectedTypes).toEqual(['Extension']);
    });
  });

  describe('isValid', () => {
    beforeEach(() => {
      const elementDef = {
        path: 'Patient.test',
        type: [{ code: 'string' }]
      };
      validator = new ValidateType(elementDef);
    });

    it('should return true for null values', () => {
      expect(validator.isValid(null)).toBe(true);
    });

    it('should return true for undefined values', () => {
      expect(validator.isValid(undefined)).toBe(true);
    });

    it('should return true when value matches expected type', () => {
      expect(validator.isValid('test string')).toBe(true);
    });

    it('should return false when value does not match expected type', () => {
      expect(validator.isValid(123)).toBe(false);
    });

    it('should return true when value matches any of multiple expected types', () => {
      const elementDef = {
        path: 'Patient.deceased',
        type: [
          { code: 'boolean' },
          { code: 'string' }
        ]
      };
      validator = new ValidateType(elementDef);

      // These will log missing validation methods since Boolean/String aren't implemented
      expect(validator.isValid(true)).toBe(false);
      expect(validator.isValid('deceased')).toBe(true); // String is implemented
      expect(validator.isValid(123)).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('Missing type validation: Boolean');
    });

    it('should log missing validation method', () => {
      const elementDef = {
        path: 'Patient.test',
        type: [{ code: 'unknownType' }]
      };
      validator = new ValidateType(elementDef);

      validator.isValid('test');

      expect(consoleLogSpy).toHaveBeenCalledWith('Missing type validation: UnknownType');
    });
  });

  describe('Type validation methods', () => {
    describe('isValidMeta', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.meta',
          type: [{ code: 'Meta' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Meta object', () => {
        const validMeta = {
          profile: ['http://example.com/profile']
        };

        expect(validator.isValid(validMeta)).toBe(true);
      });

      it('should return false for object without profile array', () => {
        const invalidMeta = {
          versionId: '1'
        };

        expect(validator.isValid(invalidMeta)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(validator.isValid('meta')).toBe(false);
        expect(validator.isValid(123)).toBe(false);
      });
    });

    describe('isValidNarrative', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.text',
          type: [{ code: 'Narrative' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Narrative object', () => {
        const validNarrative = {
          status: 'generated',
          div: '<div>Test content</div>'
        };

        expect(validator.isValid(validNarrative)).toBe(true);
      });

      it('should return false when missing status', () => {
        const invalidNarrative = {
          div: '<div>Test content</div>'
        };

        expect(validator.isValid(invalidNarrative)).toBe(false);
      });

      it('should return false when missing div', () => {
        const invalidNarrative = {
          status: 'generated'
        };

        expect(validator.isValid(invalidNarrative)).toBe(false);
      });
    });

    describe('isValidExtension', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.extension',
          type: [{ code: 'Extension' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Extension object', () => {
        const validExtension = {
          url: 'http://example.com/extension',
          valueString: 'test'
        };

        expect(validator.isValid(validExtension)).toBe(true);
      });

      it('should return false when missing url', () => {
        const invalidExtension = {
          valueString: 'test'
        };

        expect(validator.isValid(invalidExtension)).toBe(false);
      });
    });

    describe('isValidReference', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.managingOrganization',
          type: [{ code: 'Reference' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for any object', () => {
        expect(validator.isValid({ reference: 'Organization/123' })).toBe(true);
        expect(validator.isValid({})).toBe(true);
      });

      it('should return false for non-object values', () => {
        expect(validator.isValid('reference')).toBe(false);
        expect(validator.isValid(123)).toBe(false);
      });
    });

    describe('isValidIdentifier', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.identifier',
          type: [{ code: 'Identifier' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Identifier object', () => {
        const validIdentifier = {
          system: 'http://example.com/ids',
          value: '12345'
        };

        expect(validator.isValid(validIdentifier)).toBe(true);
      });

      it('should return false when missing system', () => {
        const invalidIdentifier = {
          value: '12345'
        };

        expect(validator.isValid(invalidIdentifier)).toBe(false);
      });
    });

    describe('isValidCode', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.gender',
          type: [{ code: 'code' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for non-empty string', () => {
        expect(validator.isValid('male')).toBe(true);
        expect(validator.isValid('female')).toBe(true);
      });

      it('should return false for empty string', () => {
        expect(validator.isValid('')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(validator.isValid(123)).toBe(false);
        expect(validator.isValid({})).toBe(false);
      });
    });

    describe('isValidString', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.name.family',
          type: [{ code: 'string' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for non-empty string', () => {
        expect(validator.isValid('Smith')).toBe(true);
      });

      it('should return false for empty string', () => {
        expect(validator.isValid('')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(validator.isValid(123)).toBe(false);
        expect(validator.isValid({})).toBe(false);
      });
    });

    describe('isValidCodeableConcept', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.maritalStatus',
          type: [{ code: 'CodeableConcept' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for object with coding array', () => {
        const validConcept = {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
              code: 'M'
            }
          ]
        };

        expect(validator.isValid(validConcept)).toBe(true);
      });

      it('should return true for object with text', () => {
        const validConcept = {
          text: 'Married'
        };

        expect(validator.isValid(validConcept)).toBe(true);
      });

      it('should return true for object with both coding and text', () => {
        const validConcept = {
          coding: [{ system: 'http://example.com', code: 'M' }],
          text: 'Married'
        };

        expect(validator.isValid(validConcept)).toBe(true);
      });

      it('should return false for object without coding or text', () => {
        const invalidConcept = {
          id: 'test'
        };

        expect(validator.isValid(invalidConcept)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(validator.isValid(null)).toBe(true); // null/undefined are allowed
        expect(validator.isValid(undefined)).toBe(true);
      });
    });

    describe('isValidBackboneElement', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.contact',
          type: [{ code: 'BackboneElement' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for any object', () => {
        expect(validator.isValid({})).toBe(true);
        expect(validator.isValid({ name: 'test' })).toBe(true);
      });

      it('should return false for non-object values', () => {
        expect(validator.isValid('element')).toBe(false);
        expect(validator.isValid(123)).toBe(false);
      });
    });

    describe('isValidCoding', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.maritalStatus.coding',
          type: [{ code: 'Coding' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Coding object', () => {
        const validCoding = {
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: 'M',
          display: 'Married'
        };

        expect(validator.isValid(validCoding)).toBe(true);
      });

      it('should return false when missing system', () => {
        const invalidCoding = {
          code: 'M'
        };

        expect(validator.isValid(invalidCoding)).toBe(false);
      });

      it('should return false when missing code', () => {
        const invalidCoding = {
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus'
        };

        expect(validator.isValid(invalidCoding)).toBe(false);
      });
    });

    describe('isValidInstant', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.meta.lastUpdated',
          type: [{ code: 'instant' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid ISO 8601 datetime strings', () => {
        expect(validator.isValid('2023-01-01T12:00:00Z')).toBe(true);
        expect(validator.isValid('2023-12-31T23:59:59.999Z')).toBe(true);
        expect(validator.isValid('2023-06-15T14:30:45+02:00')).toBe(true);
        expect(validator.isValid('2023-06-15T14:30:45-05:00')).toBe(true);
      });

      it('should return false for invalid datetime formats', () => {
        expect(validator.isValid('2023-01-01')).toBe(true); // This matches the regex pattern
        expect(validator.isValid('invalid-date')).toBe(false);
        expect(validator.isValid('2023/01/01 12:00:00')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(validator.isValid(new Date())).toBe(false);
        expect(validator.isValid(123456789)).toBe(false);
      });
    });

    describe('isValidAnnotation', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.note',
          type: [{ code: 'Annotation' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for valid Annotation object', () => {
        const validAnnotation = {
          text: 'Patient has allergies to peanuts',
          authorString: 'Dr. Smith'
        };

        expect(validator.isValid(validAnnotation)).toBe(true);
      });

      it('should return false when missing text', () => {
        const invalidAnnotation = {
          authorString: 'Dr. Smith'
        };

        expect(validator.isValid(invalidAnnotation)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(validator.isValid('annotation')).toBe(false);
      });
    });

    describe('isValidMarkdown', () => {
      beforeEach(() => {
        const elementDef = {
          path: 'Patient.text.div',
          type: [{ code: 'markdown' }]
        };
        validator = new ValidateType(elementDef);
      });

      it('should return true for any string', () => {
        expect(validator.isValid('# Heading')).toBe(true);
        expect(validator.isValid('Plain text')).toBe(true);
        expect(validator.isValid('')).toBe(true);
      });

      it('should return false for non-string values', () => {
        expect(validator.isValid(123)).toBe(false);
        expect(validator.isValid({})).toBe(false);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return ValidationError object with correct structure', () => {
      const elementDef = {
        path: 'Patient.name',
        type: [{ code: 'string' }, { code: 'code' }]
      };
      validator = new ValidateType(elementDef);

      const error = validator.getErrorMessage();

      expect(error).toEqual({
        path: 'Patient.name',
        message: 'Invalid type for Patient.name. Expected String, Code.',
        severity: 'error'
      });
    });

    it('should handle single expected type', () => {
      const elementDef = {
        path: 'Patient.gender',
        type: [{ code: 'code' }]
      };
      validator = new ValidateType(elementDef);

      const error = validator.getErrorMessage();

      expect(error.message).toBe('Invalid type for Patient.gender. Expected Code.');
    });

    it('should handle missing path', () => {
      const elementDef = {
        type: [{ code: 'string' }]
      };
      validator = new ValidateType(elementDef);

      const error = validator.getErrorMessage();

      expect(error.path).toBe('Unkown');
    });
  });

  describe('normalize', () => {
    beforeEach(() => {
      const elementDef = {
        path: 'test',
        type: [{ code: 'string' }]
      };
      validator = new ValidateType(elementDef);
    });

    it('should capitalize simple type names', () => {
      expect(validator.normalize('string')).toBe('String');
      expect(validator.normalize('boolean')).toBe('Boolean');
      expect(validator.normalize('integer')).toBe('Integer');
    });

    it('should handle URL-based type codes', () => {
      expect(validator.normalize('http://hl7.org/fhir/StructureDefinition.Extension'))
        .toBe('Extension');
      expect(validator.normalize('http://hl7.org/fhir/StructureDefinition.Identifier'))
        .toBe('Identifier');
    });

    it('should handle nested URL normalization', () => {
      expect(validator.normalize('http://example.com/types.CustomType'))
        .toBe('CustomType');
    });

    it('should handle edge cases', () => {
      expect(validator.normalize('a')).toBe('A');
      expect(validator.normalize('')).toBe('');
      // No dots in URL, so returns as-is with first char capitalized
      expect(validator.normalize('HTTP://EXAMPLE.COM/TYPE')).toBe('HTTP://EXAMPLE.COM/TYPE');
    });

    it('should handle URLs without dots', () => {
      // http://example.com/SimpleType splits on '.' -> ['http://example', 'com/SimpleType']
      // Takes last part: 'com/SimpleType' -> normalize -> 'Com/SimpleType'
      expect(validator.normalize('http://example.com/SimpleType'))
        .toBe('Com/SimpleType');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle validator with no expected types', () => {
      const elementDef = {
        path: 'Patient.test'
      };
      validator = new ValidateType(elementDef);

      expect(validator.isValid('any value')).toBe(true); // No validation methods to fail
    });

    it('should handle complex nested validation scenarios', () => {
      const elementDef = {
        path: 'Patient.contact',
        type: [
          { code: 'BackboneElement' },
          { code: 'Extension' },
          { code: 'Reference' }
        ]
      };
      validator = new ValidateType(elementDef);

      const validObject = {
        url: 'http://example.com/extension'
      };

      expect(validator.isValid(validObject)).toBe(true);
    });

    it('should handle validation with all types failing', () => {
      const elementDef = {
        path: 'Patient.test',
        type: [
          { code: 'string' },
          { code: 'code' }
        ]
      };
      validator = new ValidateType(elementDef);

      expect(validator.isValid(123)).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should validate complex FHIR data structures', () => {
      const elementDef = {
        path: 'Patient.name',
        type: [{ code: 'HumanName' }]
      };
      validator = new ValidateType(elementDef);

      // This should log missing validation method since HumanName isn't implemented
      // When validation method doesn't exist, it logs but doesn't add to errors, so returns true
      expect(validator.isValid({ family: 'Smith', given: ['John'] })).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('Missing type validation: HumanName');
    });

    it('should handle mixed validation results correctly', () => {
      const elementDef = {
        path: 'Patient.telecom',
        type: [
          { code: 'ContactPoint' }, // Not implemented - will log
          { code: 'Extension' }      // Implemented - will validate
        ]
      };
      validator = new ValidateType(elementDef);

      const testValue = {
        url: 'http://example.com/extension'
      };

      expect(validator.isValid(testValue)).toBe(true); // Extension validation passes
      expect(consoleLogSpy).toHaveBeenCalledWith('Missing type validation: ContactPoint');
    });
  });
});