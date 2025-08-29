import { CreateOperation } from './create-operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { Model } from 'mongoose'
import { NotAcceptableException } from '@nestjs/common'
import { FhirResponse } from '../fhir-response'
import { v4 as uuidv4 } from 'uuid'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}))

jest.mock('../fhir-response')

describe('CreateOperation', () => {
  let createOperation: CreateOperation
  let mockModel: jest.Mocked<Model<FhirResourceDocument>>
  let mockUuidv4: jest.MockedFunction<typeof uuidv4>
  let mockFhirResponse: jest.Mocked<typeof FhirResponse>

  // Helper function to create a mock saved resource
  const createMockSavedResource = (data: any): any => ({
    ...data,
    _id: 'mongodb-id',
    toObject: jest.fn().mockReturnValue({ ...data, _id: 'mongodb-id' })
  })

  beforeEach(() => {
    // Create a constructor function that returns our mock instance
    const mockModelConstructor: any = jest.fn().mockImplementation((data: any) => {
      const mockInstance = createMockSavedResource(data)
      mockInstance.save = jest.fn().mockResolvedValue(mockInstance)
      return mockInstance
    })

    // Add static methods to the constructor
    mockModelConstructor.findOne = jest.fn()

    mockModel = mockModelConstructor
    
    mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
    mockFhirResponse = FhirResponse as jest.Mocked<typeof FhirResponse>

    createOperation = new CreateOperation(mockModel)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create an instance with the provided model', () => {
      expect(createOperation).toBeInstanceOf(CreateOperation)
      expect(createOperation.fhirResourceModel).toBeDefined()
    })

    it('should extend the base Operation class', () => {
      expect(createOperation).toHaveProperty('exists')
    })
  })

  describe('execute', () => {
    const resourceType = 'Patient'
    const resourceData = {
      resourceType: 'Patient',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1980-01-01',
      active: true
    }

    beforeEach(() => {
      mockModel.findOne.mockClear()
      mockFhirResponse.format.mockClear()
      mockUuidv4.mockClear()
    })

    describe('Successful creation', () => {
      it('should create a resource with provided ID when resource does not exist', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        const formattedResource = { ...resourceWithId, _id: 'mongodb-id' }

        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithId)

        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: 'patient-123'
        })
        expect(mockModel).toHaveBeenCalledWith(resourceWithId)
        expect(mockFhirResponse.format).toHaveBeenCalled()
        expect(result).toEqual(formattedResource)
      })

      it('should generate UUID and create resource when no ID provided', async () => {
        const generatedId = 'generated-uuid-123'
        const resourceWithGeneratedId = { ...resourceData, id: generatedId }
        const formattedResource = { ...resourceWithGeneratedId, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceData)

        expect(mockUuidv4).toHaveBeenCalled()
        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: generatedId
        })
        expect(result).toEqual(formattedResource)
      })

      it('should handle resource with numeric ID', async () => {
        const generatedId = 'generated-uuid-numeric'
        const resourceWithNumericId = { ...resourceData, id: 12345 }
        const expectedResource = { ...resourceData, id: generatedId }
        const formattedResource = { ...expectedResource, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithNumericId)

        expect(mockUuidv4).toHaveBeenCalled()
        expect(result).toEqual(formattedResource)
      })

      it('should handle resource with null ID', async () => {
        const generatedId = 'generated-uuid-null'
        const resourceWithNullId = { ...resourceData, id: null }
        const expectedResource = { ...resourceData, id: generatedId }
        const formattedResource = { ...expectedResource, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithNullId)

        expect(mockUuidv4).toHaveBeenCalled()
        expect(result).toEqual(formattedResource)
      })

      it('should handle different resource types', async () => {
        const testCases = [
          { type: 'Observation', data: { resourceType: 'Observation', status: 'final' } },
          { type: 'Encounter', data: { resourceType: 'Encounter', status: 'finished' } },
          { type: 'Practitioner', data: { resourceType: 'Practitioner', active: true } },
          { type: 'Organization', data: { resourceType: 'Organization', active: true } }
        ]

        for (const testCase of testCases) {
          const resourceWithId = { ...testCase.data, id: `${testCase.type.toLowerCase()}-123` }
          const formattedResource = { ...resourceWithId, _id: 'mongodb-id' }

          mockModel.findOne.mockResolvedValue(null)
          mockFhirResponse.format.mockReturnValue(formattedResource)

          const result = await createOperation.execute(testCase.type, resourceWithId)

          expect(mockModel.findOne).toHaveBeenCalledWith({
            resourceType: testCase.type,
            id: `${testCase.type.toLowerCase()}-123`
          })
          expect(result).toEqual(formattedResource)

          mockModel.findOne.mockClear()
          mockFhirResponse.format.mockClear()
        }
      })

      it('should preserve all resource data during creation', async () => {
        const complexResource = {
          resourceType: 'Patient',
          id: 'patient-complex',
          meta: {
            versionId: '1',
            lastUpdated: '2023-01-01T00:00:00Z',
            profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
          },
          identifier: [{
            system: 'http://example.org/patient-ids',
            value: '12345'
          }],
          name: [{
            family: 'Doe',
            given: ['John', 'James'],
            prefix: ['Mr.']
          }],
          telecom: [{
            system: 'phone',
            value: '+1234567890',
            use: 'home'
          }],
          gender: 'male',
          birthDate: '1980-01-01',
          address: [{
            line: ['123 Main St'],
            city: 'Anytown',
            state: 'NY',
            postalCode: '12345'
          }],
          active: true
        }

        const formattedResource = { ...complexResource, _id: 'mongodb-id' }

        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute('Patient', complexResource)

        expect(result).toEqual(formattedResource)
        expect(mockFhirResponse.format).toHaveBeenCalled()
      })
    })

    describe('Resource already exists', () => {
      it('should throw NotAcceptableException when resource with ID already exists', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        const existingResource = { id: 'patient-123', resourceType: 'Patient' }

        mockModel.findOne.mockResolvedValue(existingResource as any)

        await expect(createOperation.execute(resourceType, resourceWithId))
          .rejects
          .toThrow(NotAcceptableException)

        const error = await createOperation.execute(resourceType, resourceWithId)
          .catch(err => err)

        expect(error).toBeInstanceOf(NotAcceptableException)
        expect(error.getResponse()).toEqual({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'Resource already exists',
            details: {
              text: 'Patient/patient-123 already deleted'
            }
          }]
        })
      })

      it('should throw NotAcceptableException when generated UUID conflicts', async () => {
        const generatedId = 'generated-uuid-123'
        const existingResource = { id: generatedId, resourceType: 'Patient' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(existingResource as any)

        await expect(createOperation.execute(resourceType, resourceData))
          .rejects
          .toThrow(NotAcceptableException)
      })

      it('should not save resource when resource already exists', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        const existingResource = { id: 'patient-123', resourceType: 'Patient' }

        mockModel.findOne.mockResolvedValue(existingResource as any)

        await createOperation.execute(resourceType, resourceWithId)
          .catch(() => {}) // Expected to throw

        expect(mockModel).not.toHaveBeenCalled()
        expect(mockFhirResponse.format).not.toHaveBeenCalled()
      })
    })

    describe('Error handling', () => {
      it('should propagate database errors during exists check', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        const databaseError = new Error('Database connection failed')

        mockModel.findOne.mockRejectedValue(databaseError)

        await expect(createOperation.execute(resourceType, resourceWithId))
          .rejects
          .toThrow('Database connection failed')
      })

      it('should propagate errors during resource save', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        
        // Mock the constructor to create a failing save method
        const failingSave = jest.fn().mockRejectedValue(new Error('Save operation failed'))
        const mockModelConstructorFailing: any = jest.fn().mockImplementation(() => ({
          save: failingSave,
          toObject: jest.fn()
        }))
        mockModelConstructorFailing.findOne = jest.fn().mockResolvedValue(null)
        
        const failingOperation = new CreateOperation(mockModelConstructorFailing)

        await expect(failingOperation.execute(resourceType, resourceWithId))
          .rejects
          .toThrow('Save operation failed')
      })

      it('should handle mongoose validation errors', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }
        const validationError = new Error('Validation failed')
        validationError.name = 'ValidationError'

        const validationFailingSave = jest.fn().mockRejectedValue(validationError)
        const mockModelConstructorValidation: any = jest.fn().mockImplementation(() => ({
          save: validationFailingSave,
          toObject: jest.fn()
        }))
        mockModelConstructorValidation.findOne = jest.fn().mockResolvedValue(null)
        
        const validationFailingOperation = new CreateOperation(mockModelConstructorValidation)

        await expect(validationFailingOperation.execute(resourceType, resourceWithId))
          .rejects
          .toThrow('Validation failed')
      })
    })

    describe('UUID generation edge cases', () => {
      it('should handle empty string ID by using the empty string', async () => {
        const resourceWithEmptyId = { ...resourceData, id: '' }
        const formattedResource = { ...resourceWithEmptyId, _id: 'mongodb-id' }

        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithEmptyId)

        expect(mockUuidv4).not.toHaveBeenCalled()
        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: ''
        })
        expect(result).toEqual(formattedResource)
      })

      it('should handle undefined ID by generating UUID', async () => {
        const generatedId = 'generated-uuid-undefined'
        const resourceWithUndefinedId = { ...resourceData, id: undefined }
        const expectedResource = { ...resourceData, id: generatedId }
        const formattedResource = { ...expectedResource, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithUndefinedId)

        expect(mockUuidv4).toHaveBeenCalled()
        expect(result).toEqual(formattedResource)
      })

      it('should handle boolean ID by generating UUID', async () => {
        const generatedId = 'generated-uuid-boolean'
        const resourceWithBooleanId = { ...resourceData, id: true }
        const expectedResource = { ...resourceData, id: generatedId }
        const formattedResource = { ...expectedResource, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithBooleanId)

        expect(mockUuidv4).toHaveBeenCalled()
        expect(result).toEqual(formattedResource)
      })
    })

    describe('Special characters and edge cases', () => {
      it('should handle special characters in resource IDs', async () => {
        const specialIds = [
          'patient-with-dashes',
          'patient_with_underscores',
          'patient.with.dots',
          'PATIENT-CAPS',
          'patient-123-ñíño'
        ]

        for (const specialId of specialIds) {
          const resourceWithSpecialId = { ...resourceData, id: specialId }
          const formattedResource = { ...resourceWithSpecialId, _id: 'mongodb-id' }

          mockModel.findOne.mockResolvedValue(null)
          mockFhirResponse.format.mockReturnValue(formattedResource)

          const result = await createOperation.execute(resourceType, resourceWithSpecialId)

          expect(mockModel.findOne).toHaveBeenCalledWith({
            resourceType: resourceType,
            id: specialId
          })
          expect(result).toEqual(formattedResource)

          mockModel.findOne.mockClear()
          mockFhirResponse.format.mockClear()
        }
      })

      it('should handle very long resource IDs', async () => {
        const longId = 'a'.repeat(1000)
        const resourceWithLongId = { ...resourceData, id: longId }
        const formattedResource = { ...resourceWithLongId, _id: 'mongodb-id' }

        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, resourceWithLongId)

        expect(result).toEqual(formattedResource)
      })

      it('should handle empty resource data', async () => {
        const generatedId = 'generated-uuid-empty-data'
        const emptyResourceData = {}
        const expectedResource = { id: generatedId }
        const formattedResource = { ...expectedResource, _id: 'mongodb-id' }

        mockUuidv4.mockReturnValue(generatedId as any)
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await createOperation.execute(resourceType, emptyResourceData)

        expect(result).toEqual(formattedResource)
      })

      it('should handle null resource data by throwing error', async () => {
        await expect(createOperation.execute(resourceType, null))
          .rejects
          .toThrow("Cannot read properties of null (reading 'id')")
      })
    })

    describe('Concurrent operations', () => {
      it('should handle concurrent create operations', async () => {
        const resource1 = { ...resourceData, id: 'patient-1' }
        const resource2 = { ...resourceData, id: 'patient-2' }
        const formattedResource1 = { ...resource1, _id: 'mongodb-id-1' }
        const formattedResource2 = { ...resource2, _id: 'mongodb-id-2' }

        mockModel.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)

        mockFhirResponse.format
          .mockReturnValueOnce(formattedResource1)
          .mockReturnValueOnce(formattedResource2)

        const [result1, result2] = await Promise.all([
          createOperation.execute('Patient', resource1),
          createOperation.execute('Patient', resource2)
        ])

        expect(result1).toEqual(formattedResource1)
        expect(result2).toEqual(formattedResource2)
        expect(mockModel.findOne).toHaveBeenCalledTimes(2)
        expect(mockModel).toHaveBeenCalledTimes(2)
      })
    })

    describe('Method behavior validation', () => {
      it('should maintain async method signature', () => {
        expect(typeof createOperation.execute).toBe('function')
        expect(createOperation.execute.constructor.name).toBe('AsyncFunction')
      })

      it('should return Promise from execute method', () => {
        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue({})

        const resultPromise = createOperation.execute('Patient', resourceData)

        expect(resultPromise).toBeInstanceOf(Promise)
      })

      it('should call exists method from base Operation class', async () => {
        const resourceWithId = { ...resourceData, id: 'patient-123' }

        mockModel.findOne.mockResolvedValue(null)
        mockFhirResponse.format.mockReturnValue({})

        await createOperation.execute(resourceType, resourceWithId)

        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: 'patient-123'
        })
      })
    })
  })

  describe('Integration with FhirResponse', () => {
    const resourceData = {
      resourceType: 'Patient',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1980-01-01',
      active: true
    }
    const resourceType = 'Patient'

    it('should call FhirResponse.format with saved resource object', async () => {
      const resourceWithId = { ...resourceData, id: 'patient-123' }

      mockModel.findOne.mockResolvedValue(null)
      mockFhirResponse.format.mockReturnValue({})

      await createOperation.execute(resourceType, resourceWithId)

      expect(mockFhirResponse.format).toHaveBeenCalled()
      expect(mockFhirResponse.format).toHaveBeenCalledTimes(1)
    })

    it('should return the result from FhirResponse.format', async () => {
      const resourceWithId = { ...resourceData, id: 'patient-123' }
      const formattedResponse = { ...resourceWithId, _id: 'mongodb-id', formatted: true }

      mockModel.findOne.mockResolvedValue(null)
      mockFhirResponse.format.mockReturnValue(formattedResponse)

      const result = await createOperation.execute(resourceType, resourceWithId)

      expect(result).toEqual(formattedResponse)
      expect(result).toHaveProperty('formatted', true)
    })
  })
})