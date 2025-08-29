import { RevIncludeOperation } from './rev-include-operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { Model } from 'mongoose'
import { Request } from 'express'
import { OperationHelpers } from './operation-helpers'

jest.mock('../search-parameter-map', () => ({
  searchParameterMap: new Map()
}))
jest.mock('./operation-helpers')

describe('RevIncludeOperation', () => {
  let revIncludeOperation: RevIncludeOperation
  let mockModel: any
  let mockFhirResourceModel: jest.Mocked<Model<FhirResourceDocument>>
  let mockRequest: jest.Mocked<Request>
  let mockSearchParameterMap: jest.Mocked<Map<string, any>>
  let mockOperationHelpers: jest.Mocked<typeof OperationHelpers>

  beforeEach(() => {
    mockModel = {
      resourceType: 'Patient',
      id: 'patient-123',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male'
    }

    mockFhirResourceModel = {
      find: jest.fn()
    } as any

    mockRequest = {} as jest.Mocked<Request>

    // Create a mock Map with get method
    mockSearchParameterMap = new Map() as jest.Mocked<Map<string, any>>
    mockSearchParameterMap.get = jest.fn()
    
    // Get the mocked searchParameterMap and assign our mock to it
    const searchParameterMapModule = jest.requireMock('../search-parameter-map')
    Object.assign(searchParameterMapModule.searchParameterMap, mockSearchParameterMap)

    mockOperationHelpers = OperationHelpers as jest.Mocked<typeof OperationHelpers>
    mockOperationHelpers.parseInstruction = jest.fn()

    revIncludeOperation = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create an instance with the provided parameters', () => {
      expect(revIncludeOperation).toBeInstanceOf(RevIncludeOperation)
      expect(revIncludeOperation.resource).toBe(mockModel)
      expect(revIncludeOperation.collection).toEqual([])
    })

    it('should initialize collection as empty array', () => {
      expect(revIncludeOperation.collection).toEqual([])
      expect(Array.isArray(revIncludeOperation.collection)).toBe(true)
    })

    it('should store the resource reference correctly', () => {
      const anotherModel = { resourceType: 'Observation', id: 'obs-456' }
      const anotherOperation = new RevIncludeOperation(anotherModel, mockFhirResourceModel, mockRequest)
      
      expect(anotherOperation.resource).toBe(anotherModel)
      expect(anotherOperation.resource).not.toBe(mockModel)
    })
  })

  describe('execute', () => {
    beforeEach(() => {
      mockFhirResourceModel.find.mockClear()
      mockSearchParameterMap.get.mockClear()
      mockOperationHelpers.parseInstruction.mockClear()
    })

    describe('Single revinclude instruction', () => {
      it('should process single string revinclude instruction successfully', async () => {
        const revInclude = 'Observation:patient'
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const searchDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const referencingObservations = [
          {
            resourceType: 'Observation',
            id: 'obs-1',
            subject: { reference: 'Patient/patient-123' },
            status: 'final'
          },
          {
            resourceType: 'Observation',
            id: 'obs-2',
            subject: { reference: 'Patient/patient-123' },
            status: 'preliminary'
          }
        ]

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(searchDefinition)
        
        const mockFind = {
          lean: jest.fn().mockResolvedValue(referencingObservations)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        const result = await revIncludeOperation.execute(revInclude)

        expect(mockOperationHelpers.parseInstruction).toHaveBeenCalledWith(revInclude, 0, [revInclude])
        expect(mockSearchParameterMap.get).toHaveBeenCalledWith('Observation:patient')
        expect(mockFhirResourceModel.find).toHaveBeenCalledWith({
          resourceType: 'Observation',
          'subject.reference': 'Patient/patient-123'
        })
        expect(mockFind.lean).toHaveBeenCalled()
        expect(result).toEqual(referencingObservations)
        expect(revIncludeOperation.collection).toEqual(referencingObservations)
      })

      it('should handle empty result set', async () => {
        const revInclude = 'Observation:patient'
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const searchDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(searchDefinition)
        
        const mockFind = {
          lean: jest.fn().mockResolvedValue([])
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        const result = await revIncludeOperation.execute(revInclude)

        expect(result).toEqual([])
        expect(revIncludeOperation.collection).toEqual([])
      })

      it('should skip instruction when search parameter definition not found', async () => {
        const revInclude = 'UnknownResource:unknown-parameter'
        const parsedInstruction = {
          sourceResource: 'UnknownResource',
          searchParameter: 'unknown-parameter',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(undefined)

        const result = await revIncludeOperation.execute(revInclude)

        expect(mockOperationHelpers.parseInstruction).toHaveBeenCalledWith(revInclude, 0, [revInclude])
        expect(mockSearchParameterMap.get).toHaveBeenCalledWith('UnknownResource:unknown-parameter')
        expect(mockFhirResourceModel.find).not.toHaveBeenCalled()
        expect(result).toEqual([])
      })
    })

    describe('Multiple revinclude instructions', () => {
      it('should process array of revinclude instructions', async () => {
        const revIncludes = ['Observation:patient', 'Encounter:patient']
        const parsedInstructions = [
          {
            sourceResource: 'Observation',
            searchParameter: 'patient',
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          },
          {
            sourceResource: 'Encounter',
            searchParameter: 'patient',
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          }
        ]
        const observationDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const encounterDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const observations = [
          { resourceType: 'Observation', id: 'obs-1', subject: { reference: 'Patient/patient-123' } }
        ]
        const encounters = [
          { resourceType: 'Encounter', id: 'enc-1', subject: { reference: 'Patient/patient-123' } }
        ]

        mockOperationHelpers.parseInstruction
          .mockReturnValueOnce(parsedInstructions[0])
          .mockReturnValueOnce(parsedInstructions[1])
        
        mockSearchParameterMap.get
          .mockReturnValueOnce(observationDefinition)
          .mockReturnValueOnce(encounterDefinition)

        const mockFindObservation = {
          lean: jest.fn().mockResolvedValue(observations)
        }
        const mockFindEncounter = {
          lean: jest.fn().mockResolvedValue(encounters)
        }
        
        mockFhirResourceModel.find
          .mockReturnValueOnce(mockFindObservation as any)
          .mockReturnValueOnce(mockFindEncounter as any)

        const result = await revIncludeOperation.execute(revIncludes)

        expect(mockOperationHelpers.parseInstruction).toHaveBeenCalledTimes(2)
        expect(mockSearchParameterMap.get).toHaveBeenCalledTimes(2)
        expect(mockFhirResourceModel.find).toHaveBeenCalledTimes(2)
        expect(result).toEqual([...observations, ...encounters])
        expect(revIncludeOperation.collection).toEqual([...observations, ...encounters])
      })

      it('should handle mix of valid and invalid instructions', async () => {
        const revIncludes = ['Observation:patient', 'Invalid:format']
        const parsedInstructions = [
          {
            sourceResource: 'Observation',
            searchParameter: 'patient',
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          },
          {
            sourceResource: 'Invalid',
            searchParameter: 'format',
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          }
        ]
        const observationDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const observations = [
          { resourceType: 'Observation', id: 'obs-1' }
        ]

        mockOperationHelpers.parseInstruction
          .mockReturnValueOnce(parsedInstructions[0])
          .mockReturnValueOnce(parsedInstructions[1])
        
        mockSearchParameterMap.get
          .mockReturnValueOnce(observationDefinition)
          .mockReturnValueOnce(undefined) // Invalid instruction returns undefined

        const mockFind = {
          lean: jest.fn().mockResolvedValue(observations)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        const result = await revIncludeOperation.execute(revIncludes)

        expect(mockFhirResourceModel.find).toHaveBeenCalledTimes(1) // Only valid instruction processed
        expect(result).toEqual(observations)
      })

      it('should accumulate results from multiple instructions', async () => {
        const revIncludes = ['Observation:patient', 'Encounter:patient', 'DiagnosticReport:patient']
        const observations = [{ resourceType: 'Observation', id: 'obs-1' }]
        const encounters = [{ resourceType: 'Encounter', id: 'enc-1' }]
        const reports = [{ resourceType: 'DiagnosticReport', id: 'report-1' }]

        // Setup mocks for all three instructions
        mockOperationHelpers.parseInstruction
          .mockReturnValueOnce({ sourceResource: 'Observation', searchParameter: 'patient', targetResource: undefined, modifier: undefined, iterate: false })
          .mockReturnValueOnce({ sourceResource: 'Encounter', searchParameter: 'patient', targetResource: undefined, modifier: undefined, iterate: false })
          .mockReturnValueOnce({ sourceResource: 'DiagnosticReport', searchParameter: 'patient', targetResource: undefined, modifier: undefined, iterate: false })
        
        mockSearchParameterMap.get
          .mockReturnValue({ path: 'subject.reference', target: ['Patient'] })

        const mockFind1 = { lean: jest.fn().mockResolvedValue(observations) }
        const mockFind2 = { lean: jest.fn().mockResolvedValue(encounters) }
        const mockFind3 = { lean: jest.fn().mockResolvedValue(reports) }
        
        mockFhirResourceModel.find
          .mockReturnValueOnce(mockFind1 as any)
          .mockReturnValueOnce(mockFind2 as any)
          .mockReturnValueOnce(mockFind3 as any)

        const result = await revIncludeOperation.execute(revIncludes)

        expect(result).toEqual([...observations, ...encounters, ...reports])
        expect(revIncludeOperation.collection).toHaveLength(3)
      })
    })

    describe('Different resource types and search parameters', () => {
      it('should handle different resource types correctly', async () => {
        const testCases = [
          {
            instruction: 'Observation:performer',
            sourceResource: 'Observation',
            searchParameter: 'performer',
            path: 'performer.reference',
            expectedReference: 'Patient/patient-123'
          },
          {
            instruction: 'Encounter:practitioner',
            sourceResource: 'Encounter',
            searchParameter: 'practitioner',
            path: 'participant.individual.reference',
            expectedReference: 'Patient/patient-123'
          },
          {
            instruction: 'MedicationRequest:patient',
            sourceResource: 'MedicationRequest',
            searchParameter: 'patient',
            path: 'subject.reference',
            expectedReference: 'Patient/patient-123'
          }
        ]

        for (const testCase of testCases) {
          // Reset the operation for each test case
          revIncludeOperation = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)
          
          const parsedInstruction = {
            sourceResource: testCase.sourceResource,
            searchParameter: testCase.searchParameter,
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          }
          const definition = {
            path: testCase.path,
            target: ['Patient']
          }
          const resources = [
            { resourceType: testCase.sourceResource, id: `${testCase.sourceResource.toLowerCase()}-1` }
          ]

          mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
          mockSearchParameterMap.get.mockReturnValue(definition)
          
          const mockFind = {
            lean: jest.fn().mockResolvedValue(resources)
          }
          mockFhirResourceModel.find.mockReturnValue(mockFind as any)

          const result = await revIncludeOperation.execute(testCase.instruction)

          expect(mockFhirResourceModel.find).toHaveBeenCalledWith({
            resourceType: testCase.sourceResource,
            [testCase.path]: testCase.expectedReference
          })
          expect(result).toEqual(resources)

          // Clear mocks for next iteration
          mockOperationHelpers.parseInstruction.mockClear()
          mockSearchParameterMap.get.mockClear()
          mockFhirResourceModel.find.mockClear()
        }
      })

      it('should handle resources with different ID formats', async () => {
        const testResources = [
          { resourceType: 'Patient', id: 'patient-123' },
          { resourceType: 'Patient', id: '456' },
          { resourceType: 'Patient', id: 'patient-with-dashes-and_underscores' },
          { resourceType: 'Patient', id: 'PATIENT-CAPS' }
        ]

        for (const resource of testResources) {
          revIncludeOperation = new RevIncludeOperation(resource, mockFhirResourceModel, mockRequest)

          const parsedInstruction = {
            sourceResource: 'Observation',
            searchParameter: 'patient',
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          }
          const definition = {
            path: 'subject.reference',
            target: ['Patient']
          }

          mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
          mockSearchParameterMap.get.mockReturnValue(definition)
          
          const mockFind = {
            lean: jest.fn().mockResolvedValue([])
          }
          mockFhirResourceModel.find.mockReturnValue(mockFind as any)

          await revIncludeOperation.execute('Observation:patient')

          expect(mockFhirResourceModel.find).toHaveBeenCalledWith({
            resourceType: 'Observation',
            'subject.reference': `${resource.resourceType}/${resource.id}`
          })

          // Clear mocks for next iteration
          mockOperationHelpers.parseInstruction.mockClear()
          mockSearchParameterMap.get.mockClear()
          mockFhirResourceModel.find.mockClear()
        }
      })
    })

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        const revInclude = 'Observation:patient'
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const searchDefinition = {
          path: 'subject.reference',
          target: ['Patient']
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(searchDefinition)
        
        const mockFind = {
          lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        await expect(revIncludeOperation.execute(revInclude))
          .rejects
          .toThrow('Database connection failed')
      })

      it('should handle parsing errors from OperationHelpers', async () => {
        const revInclude = 'Invalid'
        const parseError = new Error('Invalid _include/_revinclude format')

        mockOperationHelpers.parseInstruction.mockImplementation(() => {
          throw parseError
        })

        await expect(revIncludeOperation.execute(revInclude))
          .rejects
          .toThrow('Invalid _include/_revinclude format')
      })

      it('should handle missing path in search definition', async () => {
        const revInclude = 'Observation:patient'
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const incompleteDefinition = {
          target: ['Patient']
          // Missing path property
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(incompleteDefinition)

        const mockFind = {
          lean: jest.fn().mockResolvedValue([])
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        const result = await revIncludeOperation.execute(revInclude)

        // Should attempt to query even with undefined path
        const expectedQuery = {
          resourceType: 'Observation'
        }
        expectedQuery[undefined as any] = 'Patient/patient-123'
        expect(mockFhirResourceModel.find).toHaveBeenCalledWith(expectedQuery)
        expect(result).toEqual([])
      })
    })

    describe('Collection management', () => {
      it('should maintain separate collections for different operations', () => {
        const operation1 = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)
        const operation2 = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)

        operation1.collection.push({ id: 'test1' })
        operation2.collection.push({ id: 'test2' })

        expect(operation1.collection).toEqual([{ id: 'test1' }])
        expect(operation2.collection).toEqual([{ id: 'test2' }])
        expect(operation1.collection).not.toBe(operation2.collection)
      })

      it('should persist collection across multiple execute calls', async () => {
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const definition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const firstBatch = [{ resourceType: 'Observation', id: 'obs-1' }]
        const secondBatch = [{ resourceType: 'Observation', id: 'obs-2' }]

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(definition)

        // First execute call
        const mockFind1 = { lean: jest.fn().mockResolvedValue(firstBatch) }
        mockFhirResourceModel.find.mockReturnValue(mockFind1 as any)
        
        const result1 = await revIncludeOperation.execute('Observation:patient')
        expect(result1).toEqual(firstBatch)
        expect(revIncludeOperation.collection).toEqual(firstBatch)

        // Second execute call
        const mockFind2 = { lean: jest.fn().mockResolvedValue(secondBatch) }
        mockFhirResourceModel.find.mockReturnValue(mockFind2 as any)
        
        const result2 = await revIncludeOperation.execute('Observation:patient')
        expect(result2).toEqual([...firstBatch, ...secondBatch])
        expect(revIncludeOperation.collection).toEqual([...firstBatch, ...secondBatch])
      })
    })

    describe('Integration with search parameter map', () => {
      it('should use correct search parameter map keys', async () => {
        const testCases = [
          { instruction: 'Observation:patient', expectedKey: 'Observation:patient' },
          { instruction: 'Encounter:practitioner', expectedKey: 'Encounter:practitioner' },
          { instruction: 'MedicationRequest:medication', expectedKey: 'MedicationRequest:medication' }
        ]

        for (const testCase of testCases) {
          mockOperationHelpers.parseInstruction.mockReturnValue({
            sourceResource: testCase.instruction.split(':')[0],
            searchParameter: testCase.instruction.split(':')[1],
            targetResource: undefined,
            modifier: undefined,
            iterate: false
          })
          mockSearchParameterMap.get.mockReturnValue(undefined) // Skip actual processing

          await revIncludeOperation.execute(testCase.instruction)

          expect(mockSearchParameterMap.get).toHaveBeenCalledWith(testCase.expectedKey)

          mockOperationHelpers.parseInstruction.mockClear()
          mockSearchParameterMap.get.mockClear()
        }
      })
    })

    describe('Method behavior validation', () => {
      it('should maintain async method signature', () => {
        expect(typeof revIncludeOperation.execute).toBe('function')
        expect(revIncludeOperation.execute.constructor.name).toBe('AsyncFunction')
      })

      it('should return Promise from execute method', () => {
        mockOperationHelpers.parseInstruction.mockReturnValue({
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        })
        mockSearchParameterMap.get.mockReturnValue(undefined)

        const resultPromise = revIncludeOperation.execute('Observation:patient')
        expect(resultPromise).toBeInstanceOf(Promise)
      })

      it('should handle concurrent execute calls', async () => {
        const instruction = 'Observation:patient'
        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const definition = {
          path: 'subject.reference',
          target: ['Patient']
        }
        const resources1 = [{ resourceType: 'Observation', id: 'obs-1' }]
        const resources2 = [{ resourceType: 'Observation', id: 'obs-2' }]

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(definition)

        const mockFind1 = { lean: jest.fn().mockResolvedValue(resources1) }
        const mockFind2 = { lean: jest.fn().mockResolvedValue(resources2) }
        
        mockFhirResourceModel.find
          .mockReturnValueOnce(mockFind1 as any)
          .mockReturnValueOnce(mockFind2 as any)

        // Create separate operations to test concurrency
        const operation1 = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)
        const operation2 = new RevIncludeOperation(mockModel, mockFhirResourceModel, mockRequest)

        const [result1, result2] = await Promise.all([
          operation1.execute(instruction),
          operation2.execute(instruction)
        ])

        expect(result1).toEqual(resources1)
        expect(result2).toEqual(resources2)
        expect(mockFhirResourceModel.find).toHaveBeenCalledTimes(2)
      })
    })

    describe('Edge cases', () => {
      it('should handle empty revInclude arrays', async () => {
        const result = await revIncludeOperation.execute([])

        expect(mockOperationHelpers.parseInstruction).not.toHaveBeenCalled()
        expect(mockFhirResourceModel.find).not.toHaveBeenCalled()
        expect(result).toEqual([])
      })

      it('should handle resource without id', async () => {
        const resourceWithoutId = {
          resourceType: 'Patient',
          name: [{ family: 'Doe' }]
          // No id property
        }
        revIncludeOperation = new RevIncludeOperation(resourceWithoutId, mockFhirResourceModel, mockRequest)

        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const definition = {
          path: 'subject.reference',
          target: ['Patient']
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(definition)

        const mockFind = { lean: jest.fn().mockResolvedValue([]) }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        await revIncludeOperation.execute('Observation:patient')

        expect(mockFhirResourceModel.find).toHaveBeenCalledWith({
          resourceType: 'Observation',
          'subject.reference': 'Patient/undefined'
        })
      })

      it('should handle resource without resourceType', async () => {
        const resourceWithoutType = {
          id: 'patient-123',
          name: [{ family: 'Doe' }]
          // No resourceType property
        }
        revIncludeOperation = new RevIncludeOperation(resourceWithoutType, mockFhirResourceModel, mockRequest)

        const parsedInstruction = {
          sourceResource: 'Observation',
          searchParameter: 'patient',
          targetResource: undefined,
          modifier: undefined,
          iterate: false
        }
        const definition = {
          path: 'subject.reference',
          target: ['Patient']
        }

        mockOperationHelpers.parseInstruction.mockReturnValue(parsedInstruction)
        mockSearchParameterMap.get.mockReturnValue(definition)

        const mockFind = { lean: jest.fn().mockResolvedValue([]) }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        await revIncludeOperation.execute('Observation:patient')

        expect(mockFhirResourceModel.find).toHaveBeenCalledWith({
          resourceType: 'Observation',
          'subject.reference': 'undefined/patient-123'
        })
      })
    })
  })
})