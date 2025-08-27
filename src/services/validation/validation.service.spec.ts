import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ValidationService } from './validation.service';
import { TerminologyService } from '../terminology/terminology.service';
import { StructureDefinitionSchema } from '../../schema/structure-definition.schema';
import { StructureDefinition } from '../../interfaces/structure-definition';
import * as fhirPath from 'fhirpath';

// Mock dependencies
jest.mock('fhirpath');
jest.mock('../../lib/validation/validate-type', () => ({
  ValidateType: jest.fn().mockImplementation(() => ({
    isValid: jest.fn().mockReturnValue(true),
    getErrorMessage: jest.fn().mockReturnValue({
      path: 'test.path',
      severity: 'error',
      message: 'Test error'
    })
  }))
}));

describe('ValidationService', () => {
  let service: ValidationService;
  let mockStructureDefinitionModel: any;
  let mockTerminologyService: jest.Mocked<TerminologyService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  const mockStructureDefinition: StructureDefinition = {
    resourceType: 'StructureDefinition',
    id: 'Patient',
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    type: 'Patient',
    baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
    snapshot: {
      element: [
        {
          id: 'Patient',
          path: 'Patient',
          min: 0,
          max: '*'
        },
        {
          id: 'Patient.id',
          path: 'Patient.id',
          min: 0,
          max: '1',
          type: [{ code: 'id' }]
        },
        {
          id: 'Patient.meta',
          path: 'Patient.meta',
          min: 0,
          max: '1',
          type: [{ code: 'Meta' }]
        },
        {
          id: 'Patient.name',
          path: 'Patient.name',
          min: 0,
          max: '*',
          type: [{ code: 'HumanName' }]
        },
        {
          id: 'Patient.gender',
          path: 'Patient.gender',
          min: 0,
          max: '1',
          type: [{ code: 'code' }],
          binding: {
            strength: 'required',
            valueSet: 'http://hl7.org/fhir/ValueSet/administrative-gender'
          },
          constraint: [
            {
              key: 'gender-1',
              severity: 'error',
              human: 'Gender must be valid',
              expression: 'gender.exists()'
            }
          ]
        },
        {
          id: 'Patient.birthDate',
          path: 'Patient.birthDate',
          min: 0,
          max: '1',
          type: [{ code: 'date' }],
          constraint: [
            {
              key: 'pat-1',
              severity: 'error',
              human: 'SHALL have a birth date',
              expression: 'birthDate.exists()'
            }
          ]
        },
        {
          id: 'Patient.active',
          path: 'Patient.active',
          min: 0,
          max: '1',
          type: [{ code: 'boolean' }]
        },
        {
          id: 'Patient.telecom',
          path: 'Patient.telecom',
          min: 0,
          max: '*',
          type: [{ code: 'ContactPoint' }]
        },
        {
          id: 'Patient.address',
          path: 'Patient.address',
          min: 0,
          max: '*',
          type: [{ code: 'Address' }]
        },
        {
          id: 'Patient.identifier',
          path: 'Patient.identifier',
          min: 0,
          max: '*',
          type: [{ code: 'Identifier' }]
        }
      ]
    }
  };

  const mockValidPatient = {
    resourceType: 'Patient',
    id: 'patient-123',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
    },
    name: [
      {
        family: 'Doe',
        given: ['John']
      }
    ],
    gender: 'male',
    birthDate: '1990-01-01'
  };

  beforeEach(async () => {
    // Create mock model with simplified approach
    mockStructureDefinitionModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };

    const mockTerminology = {
      lookup: jest.fn()
    };

    const mockEmitter = {
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: getModelToken(StructureDefinitionSchema.name),
          useValue: mockStructureDefinitionModel
        },
        {
          provide: TerminologyService,
          useValue: mockTerminology
        },
        {
          provide: EventEmitter2,
          useValue: mockEmitter
        }
      ]
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    mockTerminologyService = module.get(TerminologyService);
    mockEventEmitter = module.get(EventEmitter2);

    // Setup default mocks
    mockStructureDefinitionModel.exec.mockResolvedValue({
      definition: mockStructureDefinition
    });

    (fhirPath.evaluate as jest.Mock).mockReturnValue([true]);

    // Mock console.log to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should inject dependencies correctly', () => {
      expect(mockStructureDefinitionModel).toBeDefined();
      expect(mockTerminologyService).toBeDefined();
      expect(mockEventEmitter).toBeDefined();
    });
  });

  describe('validateResource - Basic Validation', () => {
    it('should validate a valid patient resource successfully', async () => {
      const result = await service.validateResource(mockValidPatient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({
        resourceType: 'Patient'
      });
    });

    it('should return error when resource has no resourceType', async () => {
      const invalidResource = { id: 'test' };

      const result = await service.validateResource(invalidResource);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        path: 'resourceType',
        message: 'Resource should contain a resourceType property',
        severity: 'error',
        code: 'required'
      });
    });

    it('should return error when no structure definition is found', async () => {
      mockStructureDefinitionModel.exec.mockResolvedValue(null);

      const resource = { resourceType: 'UnknownResource' };
      const result = await service.validateResource(resource);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        path: 'resourceType',
        message: 'No structure definition for resource type: UnknownResource',
        severity: 'error',
        code: 'unknown-resource-type'
      });
    });

    it('should handle structure definition without definition property', async () => {
      mockStructureDefinitionModel.exec.mockResolvedValue({});

      const resource = { resourceType: 'Patient' };
      const result = await service.validateResource(resource);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('unknown-resource-type');
    });
  });

  describe('validateResource - Profile Validation', () => {
    it('should return error when resource does not declare required profile', async () => {
      const resourceWithoutProfile = {
        ...mockValidPatient,
        meta: undefined
      };

      const result = await service.validateResource(resourceWithoutProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.path === 'meta.profile' &&
        error.message.includes('Resource must declare conformance to profile')
      )).toBe(true);
    });

    it('should return error when profile array does not include required profile', async () => {
      const resourceWithWrongProfile = {
        ...mockValidPatient,
        meta: {
          profile: ['http://example.com/other-profile']
        }
      };

      const result = await service.validateResource(resourceWithWrongProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.path === 'meta.profile'
      )).toBe(true);
    });
  });

  describe('validateResource - Resource Type Validation', () => {
    it('should return error when resource type does not match structure definition', async () => {
      const wrongTypeResource = {
        ...mockValidPatient,
        resourceType: 'Observation'
      };

      const result = await service.validateResource(wrongTypeResource);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.path === 'resourceType' &&
        error.message.includes("Expected resourceType 'Patient', got 'Observation'")
      )).toBe(true);
    });
  });

  describe('validateResource - Property Validation', () => {
    it('should return error for unexpected root properties', async () => {
      const resourceWithUnexpectedProperty = {
        ...mockValidPatient,
        unexpectedProperty: 'value'
      };

      const result = await service.validateResource(resourceWithUnexpectedProperty);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.path === 'unexpectedProperty' &&
        error.message === 'Unexpected property: unexpectedProperty'
      )).toBe(true);
    });

    it('should allow effective* properties', async () => {
      const resourceWithEffectiveProperty = {
        ...mockValidPatient,
        effectiveDateTime: '2023-01-01'
      };

      const result = await service.validateResource(resourceWithEffectiveProperty);

      // Should not have error for effectiveDateTime
      expect(result.errors.some(error =>
        error.path === 'effectiveDateTime'
      )).toBe(false);
    });

    it('should allow deceased* properties', async () => {
      const resourceWithDeceasedProperty = {
        ...mockValidPatient,
        deceasedBoolean: false
      };

      const result = await service.validateResource(resourceWithDeceasedProperty);

      expect(result.errors.some(error =>
        error.path === 'deceasedBoolean'
      )).toBe(false);
    });

    it('should allow multipleBirth* properties', async () => {
      const resourceWithMultipleBirthProperty = {
        ...mockValidPatient,
        multipleBirthBoolean: false
      };

      const result = await service.validateResource(resourceWithMultipleBirthProperty);

      expect(result.errors.some(error =>
        error.path === 'multipleBirthBoolean'
      )).toBe(false);
    });

    it('should ignore properties starting with underscore', async () => {
      const resourceWithUnderscoreProperty = {
        ...mockValidPatient,
        _id: 'internal-id',
        _lastUpdated: '2023-01-01'
      };

      const result = await service.validateResource(resourceWithUnderscoreProperty);

      expect(result.errors.some(error =>
        error.path === '_id' || error.path === '_lastUpdated'
      )).toBe(false);
    });
  });

  describe('parseStructureDefinition', () => {
    it('should throw error when structure definition has no snapshot', async () => {
      const structureDefWithoutSnapshot = {
        ...mockStructureDefinition,
        snapshot: undefined
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithoutSnapshot
      });

      const resource = { resourceType: 'Patient' };

      await expect(service.validateResource(resource)).rejects.toThrow(
        'Structure definition does not have a snapshot'
      );
    });

    it('should parse structure definition with slices', async () => {
      const structureDefWithSlices = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element,
            {
              id: 'Patient.name:official',
              path: 'Patient.name',
              sliceName: 'official',
              min: 1,
              max: '1',
              type: [{ code: 'HumanName' }]
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithSlices
      });

      const result = await service.validateResource(mockValidPatient);

      // Should not throw error and should handle slices
      expect(result).toBeDefined();
    });
  });

  describe('getStructureDefinition', () => {
    it('should handle profile parameter correctly', async () => {
      const resourceWithProfile = {
        resourceType: 'Patient',
        profile: ['http://example.com/profile']
      };

      await service.validateResource(resourceWithProfile);

      expect(mockStructureDefinitionModel.findOne).toHaveBeenCalledWith({
        resourceType: 'Patient',
        url: 'http://example.com/profile'
      });
    });
  });

  describe('validateCardinality', () => {
    it('should return error for missing required element', async () => {
      // Use a structure definition with a required element (min: 1)
      const structureDefWithRequiredElement = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element.map(el =>
              el.path === 'Patient.birthDate' ? { ...el, min: 1 } : el
            )
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithRequiredElement
      });

      const resourceMissingBirthDate = {
        ...mockValidPatient,
        birthDate: undefined
      };

      const result = await service.validateResource(resourceMissingBirthDate);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.message.includes("Required element 'Patient.birthDate' is missing")
      )).toBe(true);
    });
  });

  describe('validateConstraints', () => {
    it('should validate FHIRPath constraints successfully', async () => {
      (fhirPath.evaluate as jest.Mock).mockReturnValue([true]);

      const result = await service.validateResource(mockValidPatient);

      expect(result.isValid).toBe(true);
    });

    it('should add error when constraint fails', async () => {
      (fhirPath.evaluate as jest.Mock).mockReturnValue([false]);

      const result = await service.validateResource(mockValidPatient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.message === 'SHALL have a birth date'
      )).toBe(true);
    });

    it('should handle constraint evaluation errors', async () => {
      // Mock the internal evaluateConstraint method to throw an error
      jest.spyOn(service as any, 'evaluateConstraint').mockImplementation(() => {
        throw new Error('FHIRPath evaluation failed');
      });

      const result = await service.validateResource(mockValidPatient);

      expect(result.warnings.some(warning =>
        warning.message.includes('Could not evaluate constraint')
      )).toBe(true);
    });

    it('should handle special path cases', async () => {
      // Mock the special handling for Observation.component
      const observationStructureDef = {
        ...mockStructureDefinition,
        type: 'Observation',
        snapshot: {
          element: [
            {
              id: 'Observation.component',
              path: 'Observation.component',
              min: 0,
              max: '*',
              constraint: [
                {
                  key: 'obs-7',
                  severity: 'error',
                  human: 'Component observation',
                  expression: 'code.exists() and value.exists()'
                }
              ]
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: observationStructureDef
      });

      (fhirPath.evaluate as jest.Mock).mockReturnValue([false]);

      const observationResource = {
        resourceType: 'Observation',
        meta: {
          profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
        },
        component: [{}]
      };

      const result = await service.validateResource(observationResource);

      // Special handling should prevent constraint errors for these paths
      expect(result).toBeDefined();
    });
  });

  describe('validateConstraints - Terminology Validation', () => {
    it('should validate against terminology bindings for string values', async () => {
      mockTerminologyService.lookup.mockResolvedValue([
        { code: 'male', display: 'Male' },
        { code: 'female', display: 'Female' }
      ]);

      const result = await service.validateResource(mockValidPatient);

      expect(mockTerminologyService.lookup).toHaveBeenCalledWith(
        'http://hl7.org/fhir/ValueSet/administrative-gender'
      );
      expect(result.isValid).toBe(true);
    });

    it('should return error when value is not in terminology binding', async () => {
      mockTerminologyService.lookup.mockResolvedValue([
        { code: 'male', display: 'Male' },
        { code: 'female', display: 'Female' }
      ]);

      const patientWithInvalidGender = {
        ...mockValidPatient,
        gender: 'invalid-gender'
      };

      const result = await service.validateResource(patientWithInvalidGender);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.message.includes('Value not allowed, possible values are: male, female')
      )).toBe(true);
    });

    it('should handle CodeableConcept values', async () => {
      mockTerminologyService.lookup.mockResolvedValue([
        { code: 'male', display: 'Male' }
      ]);

      const patientWithCodeableConcept = {
        ...mockValidPatient,
        gender: {
          coding: [{ code: 'male', display: 'Male' }]
        }
      };

      const result = await service.validateResource(patientWithCodeableConcept);

      expect(result.isValid).toBe(true);
    });

    it('should handle Coding values', async () => {
      mockTerminologyService.lookup.mockResolvedValue([
        { code: 'male', display: 'Male' }
      ]);

      const patientWithCoding = {
        ...mockValidPatient,
        gender: { code: 'male' }
      };

      const result = await service.validateResource(patientWithCoding);

      expect(result.isValid).toBe(true);
    });

    it('should handle terminology service returning empty array', async () => {
      mockTerminologyService.lookup.mockResolvedValue([]);

      const result = await service.validateResource(mockValidPatient);

      expect(result).toBeDefined();
    });

    it('should handle terminology service returning non-array', async () => {
      mockTerminologyService.lookup.mockResolvedValue(null as any);

      const result = await service.validateResource(mockValidPatient);

      expect(result).toBeDefined();
    });
  });

  describe('validateDataType', () => {
    it('should use ValidateType for data type validation', async () => {
      const result = await service.validateResource(mockValidPatient);

      expect(result).toBeDefined();
    });

    it('should add error when data type validation fails', async () => {

        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-require-imports
      const MockValidateType = require('../../lib/validation/validate-type').ValidateType;

      MockValidateType.mockImplementation(() => ({
        isValid: jest.fn().mockReturnValue(false),
        getErrorMessage: jest.fn().mockReturnValue({
          path: 'Patient.gender',
          severity: 'error',
          message: 'Invalid data type'
        })
      }));

      const result = await service.validateResource(mockValidPatient);

      expect(result.errors.some(error =>
        error.message === 'Invalid data type'
      )).toBe(true);
    });
  });

  describe('validatePatterns', () => {
    it('should validate pattern matching', async () => {
      const structureDefWithPattern = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element,
            {
              id: 'Patient.identifier',
              path: 'Patient.identifier',
              min: 0,
              max: '*',
              type: [{ code: 'Identifier' }],
              patternCodeableConcept: { coding: [{ system: 'http://example.com' }] }
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithPattern
      });

      (fhirPath.evaluate as jest.Mock).mockReturnValue([false]);

      const resourceWithPattern = {
        ...mockValidPatient,
        identifier: [{ system: 'http://example.com', value: '123' }]
      };

      const result = await service.validateResource(resourceWithPattern);

      expect(result.errors.some(error =>
        error.message.includes('Value does not match required pattern')
      )).toBe(true);
    });

    it('should validate fixed URI values', async () => {
      const structureDefWithFixedUri = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element,
            {
              id: 'Patient.identifier.system',
              path: 'Patient.identifier.system',
              min: 1,
              max: '1',
              type: [{ code: 'uri' }],
              fixedUri: 'http://example.com/fixed'
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithFixedUri
      });

      const resourceWithWrongFixedUri = {
        ...mockValidPatient,
        identifier: [{ system: 'http://wrong.com', value: '123' }]
      };

      const result = await service.validateResource(resourceWithWrongFixedUri);

      expect(result.errors.some(error =>
        error.message.includes("Expected fixed value 'http://example.com/fixed', got 'http://wrong.com'")
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const structureDefThatCausesError = {
        ...mockStructureDefinition,
        snapshot: null as any
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefThatCausesError
      });

      await expect(service.validateResource(mockValidPatient)).rejects.toThrow(
        'Structure definition does not have a snapshot'
      );
    });

    it('should handle unknown errors', async () => {
      // Mock validateElement to throw within the try-catch block
      jest.spyOn(service as any, 'validateElement').mockImplementation(async () => {
        throw 'String error';
      });

      const result = await service.validateResource(mockValidPatient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.message === 'Validation failed: Unknown error'
      )).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should normalize types correctly', async () => {
      const structureDefWithLowercaseTypes = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            {
              id: 'Patient.test',
              path: 'Patient.test',
              min: 0,
              max: '1',
              type: [
                { code: 'string' },
                { code: 'integer' }
              ]
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithLowercaseTypes
      });

      const result = await service.validateResource(mockValidPatient);

      expect(result).toBeDefined();
    });

    it('should handle choice types with value[x] pattern', async () => {
      const structureDefWithChoice = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element,
            {
              id: 'Patient.deceased[x]',
              path: 'Patient.deceased[x]',
              min: 0,
              max: '1',
              type: [
                { code: 'boolean' },
                { code: 'dateTime' }
              ],
              base: { path: 'Patient.deceased[x]', min: 0, max: '1' }
            }
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithChoice
      });

      (fhirPath.evaluate as jest.Mock).mockImplementation((resource, expression) => {
        if (expression.includes('deceasedBoolean')) {
          return [true];
        }

        return [true];
      });

      const resourceWithChoiceType = {
        ...mockValidPatient,
        deceasedBoolean: true
      };

      const result = await service.validateResource(resourceWithChoiceType);

      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex resource with multiple validation issues', async () => {
      const complexResource = {
        resourceType: 'Patient',
        name: [{ family: 'Doe' }],
        gender: 'invalid-gender',
        unexpectedProperty: 'value',
        identifier: [
          { value: '123' },
          { system: 'http://example.com', value: '456' }
        ]
      };

      mockTerminologyService.lookup.mockResolvedValue([
        { code: 'male', display: 'Male' },
        { code: 'female', display: 'Female' }
      ]);

      const result = await service.validateResource(complexResource);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);

      const errorPaths = result.errors.map(error => error.path);
      expect(errorPaths).toContain('meta.profile');
      expect(errorPaths).toContain('unexpectedProperty');
      expect(errorPaths).toContain('Patient.gender');
    });

    it('should handle resource with warnings and errors', async () => {
      const structureDefWithWarnings = {
        ...mockStructureDefinition,
        snapshot: {
          element: [
            ...mockStructureDefinition.snapshot!.element.map(el =>
              el.path === 'Patient.name' ? {
                ...el,
                constraint: [
                  {
                    key: 'pat-name-warning',
                    severity: 'warning',
                    human: 'Name should have given and family',
                    expression: 'family.exists() and given.exists()'
                  }
                ]
              } : el
            )
          ]
        }
      };

      mockStructureDefinitionModel.exec.mockResolvedValue({
        definition: structureDefWithWarnings
      });

      (fhirPath.evaluate as jest.Mock).mockImplementation((resource, expression) => {
        if (expression.includes('family.exists() and given.exists()')) {
          return [false];
        }
        
        return [true];
      });

      const resourceWithWarnings = {
        ...mockValidPatient,
        name: [{ family: 'Doe' }]
      };

      const result = await service.validateResource(resourceWithWarnings);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning =>
        warning.message === 'Name should have given and family'
      )).toBe(true);
    });

  });
});