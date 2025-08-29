import { OperationHelpers } from './operation-helpers'
import { IncludeInstruction } from '../../interfaces/include-instruction'
import { BadRequestException } from '@nestjs/common'

describe('OperationHelpers', () => {
  describe('parseInstruction', () => {
    describe('Valid instruction parsing', () => {
      it('should parse basic instruction with sourceResource and searchParameter', () => {
        const instruction = 'Patient:general-practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        })
      })

      it('should parse instruction with targetResource', () => {
        const instruction = 'Patient:general-practitioner:Practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: 'Practitioner',
          modifier: undefined,
          iterate: false
        })
      })

      it('should parse instruction with modifier', () => {
        const instruction = 'Patient:general-practitioner:Practitioner:iterate'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: 'Practitioner',
          modifier: 'iterate',
          iterate: true
        })
      })

      it('should parse instruction with wildcard targetResource', () => {
        const instruction = 'Patient:general-practitioner:*'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        })
      })

      it('should parse instruction with wildcard targetResource and modifier', () => {
        const instruction = 'Patient:general-practitioner:*:iterate'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: undefined,
          modifier: 'iterate',
          iterate: true
        })
      })

      it('should parse instruction with non-iterate modifier', () => {
        const instruction = 'Patient:general-practitioner:Practitioner:recurse'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: 'Practitioner',
          modifier: 'recurse',
          iterate: false
        })
      })

      it('should handle different resource types', () => {
        const testCases = [
          {
            instruction: 'Observation:patient',
            expected: {
              sourceResource: 'Observation',
              searchParameter: 'patient',
              targetResource: undefined,
              modifier: undefined,
              iterate: false
            }
          },
          {
            instruction: 'Encounter:practitioner:PractitionerRole',
            expected: {
              sourceResource: 'Encounter',
              searchParameter: 'practitioner',
              targetResource: 'PractitionerRole',
              modifier: undefined,
              iterate: false
            }
          },
          {
            instruction: 'Organization:partof:Organization:iterate',
            expected: {
              sourceResource: 'Organization',
              searchParameter: 'partof',
              targetResource: 'Organization',
              modifier: 'iterate',
              iterate: true
            }
          }
        ]

        testCases.forEach(({ instruction, expected }) => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(result).toEqual(expected)
        })
      })

      it('should handle search parameters with special characters', () => {
        const testCases = [
          'Patient:general-practitioner',
          'Patient:managing_organization',
          'Observation:has-member',
          'DiagnosticReport:results-interpreter',
          'MedicationRequest:medication.code'
        ]

        testCases.forEach(instruction => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(['Patient', 'Observation', 'DiagnosticReport', 'MedicationRequest']).toContain(result.sourceResource)
          expect(result.searchParameter).toBeDefined()
          expect(typeof result.searchParameter).toBe('string')
        })
      })

      it('should handle case-sensitive resource types', () => {
        const instruction = 'patient:general-practitioner:practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'patient',
          searchParameter: 'general-practitioner',
          targetResource: 'practitioner',
          modifier: undefined,
          iterate: false
        })
      })

      it('should handle extra parts in instruction', () => {
        const instruction = 'Patient:general-practitioner:Practitioner:iterate:extra:parts'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: 'general-practitioner',
          targetResource: 'Practitioner',
          modifier: 'iterate',
          iterate: true
        })
      })
    })

    describe('Edge cases and special scenarios', () => {
      it('should handle empty string parts', () => {
        const instruction = 'Patient::Practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient',
          searchParameter: '',
          targetResource: 'Practitioner',
          modifier: undefined,
          iterate: false
        })
      })

      it('should handle spaces in parts', () => {
        const instruction = 'Patient : general-practitioner : Practitioner : iterate'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient ',
          searchParameter: ' general-practitioner ',
          targetResource: ' Practitioner ',
          modifier: ' iterate',
          iterate: false // Note: ' iterate' !== 'iterate'
        })
      })

      it('should handle numeric values in parts', () => {
        const instruction = '123:456:789:iterate'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: '123',
          searchParameter: '456',
          targetResource: '789',
          modifier: 'iterate',
          iterate: true
        })
      })

      it('should handle special characters in parts', () => {
        const instruction = 'Patient@#$:general-practitioner!@#:Practitioner%^&'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Patient@#$',
          searchParameter: 'general-practitioner!@#',
          targetResource: 'Practitioner%^&',
          modifier: undefined,
          iterate: false
        })
      })

      it('should handle Unicode characters', () => {
        const instruction = 'Pátîëñt:généràl-prãctîtîõnér:Prāctītīönér:ītérätë'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: 'Pátîëñt',
          searchParameter: 'généràl-prãctîtîõnér',
          targetResource: 'Prāctītīönér',
          modifier: 'ītérätë',
          iterate: false
        })
      })

      it('should handle very long instruction strings', () => {
        const longPart = 'a'.repeat(1000)
        const instruction = `${longPart}:${longPart}:${longPart}:iterate`
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result).toEqual({
          sourceResource: longPart,
          searchParameter: longPart,
          targetResource: longPart,
          modifier: 'iterate',
          iterate: true
        })
      })
    })

    describe('Invalid instruction handling', () => {
      it('should throw BadRequestException for empty string', () => {
        expect(() => OperationHelpers.parseInstruction(''))
          .toThrow(BadRequestException)
        
        try {
          OperationHelpers.parseInstruction('')
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException)
          expect(error.message).toBe('Invalid _include/_revinclude format: ')
        }
      })

      it('should throw BadRequestException for single part', () => {
        expect(() => OperationHelpers.parseInstruction('Patient'))
          .toThrow(BadRequestException)
        
        try {
          OperationHelpers.parseInstruction('Patient')
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException)
          expect(error.message).toBe('Invalid _include/_revinclude format: Patient')
        }
      })

      it('should throw BadRequestException for instruction without colon', () => {
        expect(() => OperationHelpers.parseInstruction('Patient general-practitioner'))
          .toThrow(BadRequestException)
      })

      it('should throw BadRequestException for whitespace-only string', () => {
        expect(() => OperationHelpers.parseInstruction('   '))
          .toThrow(BadRequestException)
      })

      it('should parse single colon as empty sourceResource and searchParameter', () => {
        const result = OperationHelpers.parseInstruction(':')
        
        expect(result).toEqual({
          sourceResource: '',
          searchParameter: '',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        })
      })

      it('should parse instruction starting with colon as empty sourceResource', () => {
        const result = OperationHelpers.parseInstruction(':general-practitioner')
        
        expect(result).toEqual({
          sourceResource: '',
          searchParameter: 'general-practitioner',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        })
      })

      it('should throw BadRequestException for instruction ending with single part after split', () => {
        // This creates an array with empty first element after split
        const instruction = 'Patient'  // Only one part
        expect(() => OperationHelpers.parseInstruction(instruction))
          .toThrow(BadRequestException)
      })
    })

    describe('Return type validation', () => {
      it('should return IncludeInstruction type with all required properties', () => {
        const instruction = 'Patient:general-practitioner:Practitioner:iterate'
        const result = OperationHelpers.parseInstruction(instruction)

        // Type assertion to ensure it matches the interface
        const typedResult: IncludeInstruction = result

        expect(typedResult).toHaveProperty('sourceResource')
        expect(typedResult).toHaveProperty('searchParameter')
        expect(typedResult).toHaveProperty('targetResource')
        expect(typedResult).toHaveProperty('modifier')
        expect(typedResult).toHaveProperty('iterate')

        expect(typeof typedResult.sourceResource).toBe('string')
        expect(typeof typedResult.searchParameter).toBe('string')
        expect(typeof typedResult.iterate).toBe('boolean')
      })

      it('should handle optional properties correctly', () => {
        const instruction = 'Patient:general-practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result.targetResource).toBeUndefined()
        expect(result.modifier).toBeUndefined()
        expect(result.iterate).toBe(false)
      })
    })

    describe('Iterate flag behavior', () => {
      it('should set iterate to true only when modifier is exactly "iterate"', () => {
        const testCases = [
          { modifier: 'iterate', expected: true },
          { modifier: 'ITERATE', expected: false },
          { modifier: 'Iterate', expected: false },
          { modifier: ' iterate', expected: false },
          { modifier: 'iterate ', expected: false },
          { modifier: 'iterating', expected: false },
          { modifier: 'reiterate', expected: false },
          { modifier: '', expected: false },
          { modifier: undefined, expected: false }
        ]

        testCases.forEach(({ modifier, expected }) => {
          let instruction: string

          if (modifier === undefined) {
            instruction = 'Patient:general-practitioner'
          } else if (modifier === '') {
            instruction = 'Patient:general-practitioner:Practitioner:'
          } else {
            instruction = `Patient:general-practitioner:Practitioner:${modifier}`
          }

          const result = OperationHelpers.parseInstruction(instruction)
          expect(result.iterate).toBe(expected)
        })
      })
    })

    describe('Method behavior validation', () => {
      it('should be a static method', () => {
        expect(typeof OperationHelpers.parseInstruction).toBe('function')
        expect(OperationHelpers.parseInstruction).toBe(OperationHelpers.parseInstruction)
      })

      it('should not modify the input string', () => {
        const originalInstruction = 'Patient:general-practitioner:Practitioner:iterate'
        const instructionCopy = originalInstruction.slice()
        
        OperationHelpers.parseInstruction(originalInstruction)
        
        expect(originalInstruction).toBe(instructionCopy)
      })

      it('should handle null and undefined input appropriately', () => {
        expect(() => OperationHelpers.parseInstruction(null as any))
          .toThrow()
        
        expect(() => OperationHelpers.parseInstruction(undefined as any))
          .toThrow()
      })

      it('should be deterministic with same input', () => {
        const instruction = 'Patient:general-practitioner:Practitioner:iterate'
        const result1 = OperationHelpers.parseInstruction(instruction)
        const result2 = OperationHelpers.parseInstruction(instruction)

        expect(result1).toEqual(result2)
      })
    })

    describe('Real-world FHIR scenarios', () => {
      it('should handle common Patient include patterns', () => {
        const patientIncludes = [
          'Patient:general-practitioner',
          'Patient:organization',
          'Patient:link'
        ]

        patientIncludes.forEach(instruction => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(result.sourceResource).toBe('Patient')
          expect(result.searchParameter).toBeDefined()
        })
      })

      it('should handle common Observation include patterns', () => {
        const observationIncludes = [
          'Observation:patient',
          'Observation:performer',
          'Observation:encounter',
          'Observation:device'
        ]

        observationIncludes.forEach(instruction => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(result.sourceResource).toBe('Observation')
          expect(result.searchParameter).toBeDefined()
        })
      })

      it('should handle revinclude patterns', () => {
        const revincludes = [
          'Observation:patient:Patient',
          'Encounter:patient:Patient:iterate',
          'MedicationRequest:patient:*'
        ]

        revincludes.forEach(instruction => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(result.sourceResource).toBeDefined()
          expect(result.searchParameter).toBeDefined()
        })
      })

      it('should handle complex search parameters', () => {
        const complexParams = [
          'Patient:general-practitioner:PractitionerRole',
          'DiagnosticReport:results-interpreter:Practitioner',
          'MedicationRequest:medication.code:Medication'
        ]

        complexParams.forEach(instruction => {
          const result = OperationHelpers.parseInstruction(instruction)
          expect(
            result.searchParameter.includes('-') || result.searchParameter.includes('.')
          ).toBe(true)
        })
      })
    })

    describe('Error message validation', () => {
      it('should include the invalid instruction in error message', () => {
        const invalidInstructions = [
          'Patient',
          'invalid-format',
          '',
          'single-part'
        ]

        invalidInstructions.forEach(instruction => {
          try {
            OperationHelpers.parseInstruction(instruction)
            fail(`Expected exception for instruction: ${instruction}`)
          } catch (error) {
            expect(error).toBeInstanceOf(BadRequestException)
            expect(error.message).toContain(instruction)
            expect(error.message).toContain('Invalid _include/_revinclude format:')
          }
        })
      })
    })

    describe('Performance and edge cases', () => {
      it('should handle instructions with many colons efficiently', () => {
        const manyColons = 'a:b:c:d:e:f:g:h:i:j:k:l:m:n:o:p'
        const result = OperationHelpers.parseInstruction(manyColons)

        expect(result.sourceResource).toBe('a')
        expect(result.searchParameter).toBe('b')
        expect(result.targetResource).toBe('c')
        expect(result.modifier).toBe('d')
        expect(result.iterate).toBe(false)
      })

      it('should handle instructions with escaped colons in a predictable way', () => {
        // Note: The current implementation doesn't handle escaped colons,
        // so this test documents the current behavior
        const instruction = 'Patient:general\\:practitioner:Practitioner'
        const result = OperationHelpers.parseInstruction(instruction)

        expect(result.sourceResource).toBe('Patient')
        expect(result.searchParameter).toBe('general\\')
        expect(result.targetResource).toBe('practitioner')
        expect(result.modifier).toBe('Practitioner')
      })
    })
  })
})