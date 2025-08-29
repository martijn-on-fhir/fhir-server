import { Operation } from './operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { Model } from 'mongoose'

describe('Operation', () => {
  let operation: Operation
  let mockModel: jest.Mocked<Model<FhirResourceDocument>>

  beforeEach(() => {
    // Create a mock Mongoose model
    mockModel = {
      findOne: jest.fn()
    } as any

    operation = new Operation(mockModel)
  })

  describe('Constructor', () => {
    it('should create an instance with the provided model', () => {
      expect(operation).toBeInstanceOf(Operation)
      expect(operation.fhirResourceModel).toBe(mockModel)
    })

    it('should store the model reference correctly', () => {
      const anotherModel = {} as Model<FhirResourceDocument>
      const anotherOperation = new Operation(anotherModel)
      
      expect(anotherOperation.fhirResourceModel).toBe(anotherModel)
      expect(anotherOperation.fhirResourceModel).not.toBe(mockModel)
    })
  })

  describe('exists', () => {
    const resourceType = 'Patient'
    const resourceId = 'patient-123'

    beforeEach(() => {
      mockModel.findOne.mockClear()
    })

    it('should return resource when it exists', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        name: [{ family: 'Doe', given: ['John'] }],
        meta: {
          versionId: '1',
          lastUpdated: new Date()
        }
      }

      mockModel.findOne.mockResolvedValue(mockResource as any)

      const result = await operation.exists(resourceType, resourceId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })
      expect(result).toEqual(mockResource)
    })

    it('should return null when resource does not exist', async () => {
      mockModel.findOne.mockResolvedValue(null)

      const result = await operation.exists(resourceType, resourceId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })
      expect(result).toBeNull()
    })

    it('should return undefined when resource does not exist (mongoose behavior)', async () => {
      mockModel.findOne.mockResolvedValue(undefined)

      const result = await operation.exists(resourceType, resourceId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })
      expect(result).toBeUndefined()
    })

    it('should handle different resource types', async () => {
      const observations = [
        { resourceType: 'Observation', id: 'obs-1' },
        { resourceType: 'Encounter', id: 'enc-1' },
        { resourceType: 'Practitioner', id: 'prac-1' }
      ]

      for (const obs of observations) {
        mockModel.findOne.mockResolvedValue(obs as any)
        
        const result = await operation.exists(obs.resourceType, obs.id)
        
        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: obs.resourceType,
          id: obs.id
        })
        expect(result).toEqual(obs)
        
        mockModel.findOne.mockClear()
      }
    })

    it('should handle special characters in resource IDs', async () => {
      const specialIds = [
        'patient-with-dashes',
        'patient_with_underscores',
        'patient.with.dots',
        'patient123',
        'PATIENT-CAPS',
        'patient-with-ñ-special-chars',
        'patient/with/slashes'
      ]

      for (const specialId of specialIds) {
        const mockResource = { id: specialId, resourceType: resourceType }
        mockModel.findOne.mockResolvedValue(mockResource as any)
        
        const result = await operation.exists(resourceType, specialId)
        
        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: specialId
        })
        expect(result).toEqual(mockResource)
        
        mockModel.findOne.mockClear()
      }
    })

    it('should handle empty string parameters', async () => {
      mockModel.findOne.mockResolvedValue(null)

      const result = await operation.exists('', '')

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: '',
        id: ''
      })
      expect(result).toBeNull()
    })

    it('should handle whitespace in parameters', async () => {
      const resourceTypeWithSpaces = ' Patient '
      const idWithSpaces = ' patient-123 '

      mockModel.findOne.mockResolvedValue(null)

      const result = await operation.exists(resourceTypeWithSpaces, idWithSpaces)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceTypeWithSpaces,
        id: idWithSpaces
      })
      expect(result).toBeNull()
    })

    it('should handle null and undefined parameters', async () => {
      mockModel.findOne.mockResolvedValue(null)

      // Test with null values
      await operation.exists(null as any, null as any)
      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: null,
        id: null
      })

      mockModel.findOne.mockClear()

      // Test with undefined values
      await operation.exists(undefined as any, undefined as any)
      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: undefined,
        id: undefined
      })
    })

    it('should propagate database errors', async () => {
      const databaseError = new Error('Database connection failed')
      mockModel.findOne.mockRejectedValue(databaseError)

      await expect(operation.exists(resourceType, resourceId)).rejects.toThrow('Database connection failed')

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })
    })

    it('should handle mongoose-specific errors', async () => {
      const mongooseError = new Error('Cast to ObjectId failed')
      mongooseError.name = 'CastError'
      mockModel.findOne.mockRejectedValue(mongooseError)

      await expect(operation.exists(resourceType, resourceId)).rejects.toThrow('Cast to ObjectId failed')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Operation timed out')
      timeoutError.name = 'MongoNetworkTimeoutError'
      mockModel.findOne.mockRejectedValue(timeoutError)

      await expect(operation.exists(resourceType, resourceId)).rejects.toThrow('Operation timed out')
    })

    it('should call findOne with exact parameter structure', async () => {
      mockModel.findOne.mockResolvedValue(null)

      await operation.exists(resourceType, resourceId)

      // Verify the exact structure of the query object
      const callArgs = mockModel.findOne.mock.calls[0][0]
      expect(callArgs).toHaveProperty('resourceType', resourceType)
      expect(callArgs).toHaveProperty('id', resourceId)
      expect(callArgs).toBeDefined()

      if (callArgs) {
        expect(Object.keys(callArgs)).toHaveLength(2)
      }
    })

    it('should work with case-sensitive resource types', async () => {
      const caseSensitiveTypes = [
        'Patient',
        'patient', // lowercase
        'PATIENT', // uppercase
        'ObServaTion', // mixed case
        'StructureDefinition' // CamelCase
      ]

      for (const type of caseSensitiveTypes) {
        const mockResource = { id: resourceId, resourceType: type }
        mockModel.findOne.mockResolvedValue(mockResource as any)
        
        const result = await operation.exists(type, resourceId)
        
        expect(mockModel.findOne).toHaveBeenCalledWith({
          resourceType: type,
          id: resourceId
        })
        expect(result).toEqual(mockResource)
        
        mockModel.findOne.mockClear()
      }
    })

    it('should return the complete resource object with all fields', async () => {
      const completeResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: {
          versionId: '2',
          lastUpdated: new Date('2023-01-01T00:00:00Z'),
          profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
          security: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
            code: 'N',
            display: 'normal'
          }],
          tag: [{
            system: 'http://example.org/tags',
            code: 'test',
            display: 'Test Resource'
          }],
          source: 'http://example.org/fhir'
        },
        text: {
          status: 'generated',
          div: '<div>Patient information</div>'
        },
        identifier: [{
          system: 'http://example.org/patient-ids',
          value: '12345'
        }],
        name: [{
          family: 'Doe',
          given: ['John', 'James']
        }],
        gender: 'male',
        birthDate: '1980-01-01',
        active: true,
        extension: [{
          url: 'http://example.org/extensions/patient-race',
          valueString: 'Caucasian'
        }]
      }

      mockModel.findOne.mockResolvedValue(completeResource as any)

      const result = await operation.exists(resourceType, resourceId)

      expect(result).toEqual(completeResource)
      expect(result).toHaveProperty('meta.versionId', '2')
      expect(result).toHaveProperty('text.div', '<div>Patient information</div>')
      expect(result).toHaveProperty('identifier[0].system', 'http://example.org/patient-ids')
      expect(result).toHaveProperty('name[0].family', 'Doe')
    })

    it('should maintain referential integrity of returned object', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        data: { nested: { value: 'test' } }
      }

      mockModel.findOne.mockResolvedValue(mockResource as any)

      const result = await operation.exists(resourceType, resourceId)

      // Verify it's the same object reference (not a copy)
      expect(result).toBe(mockResource)
      expect(result.data.nested).toBe(mockResource.data.nested)
    })

    it('should handle concurrent calls correctly', async () => {
      const resource1 = { id: 'patient-1', resourceType: 'Patient' }
      const resource2 = { id: 'patient-2', resourceType: 'Patient' }
      
      mockModel.findOne
        .mockResolvedValueOnce(resource1 as any)
        .mockResolvedValueOnce(resource2 as any)

      // Make concurrent calls
      const [result1, result2] = await Promise.all([
        operation.exists('Patient', 'patient-1'),
        operation.exists('Patient', 'patient-2')
      ])

      expect(result1).toEqual(resource1)
      expect(result2).toEqual(resource2)
      expect(mockModel.findOne).toHaveBeenCalledTimes(2)
    })

    it('should preserve the async nature of the method', async () => {
      const mockResource = { id: resourceId, resourceType: resourceType }
      mockModel.findOne.mockResolvedValue(mockResource as any)

      const resultPromise = operation.exists(resourceType, resourceId)
      
      // Verify it returns a Promise
      expect(resultPromise).toBeInstanceOf(Promise)
      
      const result = await resultPromise
      expect(result).toEqual(mockResource)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long resource IDs', async () => {
      const longId = 'a'.repeat(1000) // Very long ID
      const mockResource = { id: longId, resourceType: 'Patient' }
      
      mockModel.findOne.mockResolvedValue(mockResource as any)

      const result = await operation.exists('Patient', longId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: 'Patient',
        id: longId
      })
      expect(result).toEqual(mockResource)
    })

    it('should handle Unicode characters in parameters', async () => {
      const unicodeResourceType = 'Pätîëñt'
      const unicodeId = 'pátîëñt-123-ñíño'
      
      mockModel.findOne.mockResolvedValue(null)

      await operation.exists(unicodeResourceType, unicodeId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: unicodeResourceType,
        id: unicodeId
      })
    })

    it('should handle numeric strings as IDs', async () => {
      const numericId = '12345'
      const mockResource = { id: numericId, resourceType: 'Patient' }
      
      mockModel.findOne.mockResolvedValue(mockResource as any)

      const result = await operation.exists('Patient', numericId)

      expect(result).toEqual(mockResource)
    })

    it('should maintain method signature consistency', () => {
      // Verify the method signature matches expected async pattern
      expect(typeof operation.exists).toBe('function')
      expect(operation.exists.constructor.name).toBe('AsyncFunction')
    })
  })
})