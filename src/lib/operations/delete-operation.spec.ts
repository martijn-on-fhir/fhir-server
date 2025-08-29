import { DeleteOperation } from './delete-operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { Model } from 'mongoose'
import { NotFoundException } from '@nestjs/common'

describe('DeleteOperation', () => {
  let deleteOperation: DeleteOperation
  let mockModel: jest.Mocked<Model<FhirResourceDocument>>

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn()
    } as any

    deleteOperation = new DeleteOperation(mockModel)
  })

  describe('Constructor', () => {
    it('should create an instance with the provided model', () => {
      expect(deleteOperation).toBeInstanceOf(DeleteOperation)
      expect(deleteOperation.fhirResourceModel).toBe(mockModel)
    })

    it('should extend the base Operation class', () => {
      expect(deleteOperation).toHaveProperty('exists')
    })
  })

  describe('execute', () => {
    const resourceType = 'Patient'
    const resourceId = 'patient-123'

    beforeEach(() => {
      mockModel.findOne.mockClear()
      mockModel.findOneAndUpdate.mockClear()
    })

    it('should successfully delete an existing resource', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        status: 'active',
        meta: {
          versionId: '1',
          lastUpdated: new Date('2023-01-01T00:00:00Z')
        }
      }

      const updatedResource = {
        ...mockResource,
        status: 'inactive',
        meta: {
          versionId: '2',
          lastUpdated: new Date()
        },
        tags: ['deleted']
      }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      const result = await deleteOperation.execute(resourceType, resourceId)

      expect(mockModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType, id: resourceId },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '2',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )

      expect(result).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'information',
          code: 'deleted',
          details: {
            text: `${resourceType}/${resourceId} has been deleted`
          }
        }]
      })
    })

    it('should throw NotFoundException when resource does not exist', async () => {
      mockModel.findOne.mockResolvedValue(null)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow(NotFoundException)

      const error = await deleteOperation.execute(resourceType, resourceId)
        .catch(err => err)

      expect(error).toBeInstanceOf(NotFoundException)
      expect(error.getResponse()).toEqual({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: `${resourceType}/${resourceId} not found or already deleted`
          }
        }]
      })
    })

    it('should throw NotFoundException when resource is undefined', async () => {
      mockModel.findOne.mockResolvedValue(undefined)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow(NotFoundException)
    })

    it('should throw error when update fails', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: { versionId: '1' }
      }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(null)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow('Failed to delete resource')
    })

    it('should handle version increment correctly', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: { versionId: '5' }
      }

      const updatedResource = { id: resourceId, resourceType: resourceType }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute(resourceType, resourceId)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType, id: resourceId },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '6',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )
    })

    it('should handle missing versionId gracefully', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: {}
      }

      const updatedResource = { id: resourceId, resourceType: resourceType }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute(resourceType, resourceId)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType, id: resourceId },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '1',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )
    })

    it('should handle resource with no meta field', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType
      }

      const updatedResource = { id: resourceId, resourceType: resourceType }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute(resourceType, resourceId)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType, id: resourceId },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '1',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )
    })

    it('should handle different resource types', async () => {
      const testCases = [
        { resourceType: 'Observation', id: 'obs-123' },
        { resourceType: 'Encounter', id: 'enc-456' },
        { resourceType: 'Practitioner', id: 'prac-789' },
        { resourceType: 'Organization', id: 'org-101' }
      ]

      for (const testCase of testCases) {
        const mockResource = {
          id: testCase.id,
          resourceType: testCase.resourceType,
          meta: { versionId: '1' }
        }

        const updatedResource = { id: testCase.id, resourceType: testCase.resourceType }

        mockModel.findOne.mockResolvedValue(mockResource as any)
        mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

        const result = await deleteOperation.execute(testCase.resourceType, testCase.id)

        expect(result.issue[0].details.text).toBe(`${testCase.resourceType}/${testCase.id} has been deleted`)

        mockModel.findOne.mockClear()
        mockModel.findOneAndUpdate.mockClear()
      }
    })

    it('should handle database errors during exists check', async () => {
      const databaseError = new Error('Database connection failed')
      mockModel.findOne.mockRejectedValue(databaseError)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow(`Error deleting ${resourceType}/${resourceId}: Database connection failed`)
    })

    it('should handle database errors during update', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: { versionId: '1' }
      }

      const updateError = new Error('Update operation failed')
      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockRejectedValue(updateError)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow(`Error deleting ${resourceType}/${resourceId}: Update operation failed`)
    })

    it('should preserve NotFoundException when thrown', async () => {
      const notFoundError = new NotFoundException('Custom not found message')
      mockModel.findOne.mockRejectedValue(notFoundError)

      await expect(deleteOperation.execute(resourceType, resourceId))
        .rejects
        .toThrow(NotFoundException)
    })

    it('should handle special characters in resource IDs', async () => {
      const specialIds = [
        'patient-with-dashes',
        'patient_with_underscores',
        'patient.with.dots',
        'PATIENT-CAPS',
        'patient-123-ñíño'
      ]

      for (const specialId of specialIds) {
        const mockResource = {
          id: specialId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const updatedResource = { id: specialId, resourceType: resourceType }

        mockModel.findOne.mockResolvedValue(mockResource as any)
        mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

        const result = await deleteOperation.execute(resourceType, specialId)

        expect(result.issue[0].details.text).toBe(`${resourceType}/${specialId} has been deleted`)

        mockModel.findOne.mockClear()
        mockModel.findOneAndUpdate.mockClear()
      }
    })

    it('should handle concurrent delete operations', async () => {
      const resource1 = {
        id: 'patient-1',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const resource2 = {
        id: 'patient-2',
        resourceType: 'Patient',
        meta: { versionId: '2' }
      }

      const updatedResource1 = { id: 'patient-1', resourceType: 'Patient' }
      const updatedResource2 = { id: 'patient-2', resourceType: 'Patient' }

      mockModel.findOne
        .mockResolvedValueOnce(resource1 as any)
        .mockResolvedValueOnce(resource2 as any)

      mockModel.findOneAndUpdate
        .mockResolvedValueOnce(updatedResource1 as any)
        .mockResolvedValueOnce(updatedResource2 as any)

      const [result1, result2] = await Promise.all([
        deleteOperation.execute('Patient', 'patient-1'),
        deleteOperation.execute('Patient', 'patient-2')
      ])

      expect(result1.issue[0].details.text).toBe('Patient/patient-1 has been deleted')
      expect(result2.issue[0].details.text).toBe('Patient/patient-2 has been deleted')
      expect(mockModel.findOne).toHaveBeenCalledTimes(2)
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledTimes(2)
    })

    it('should handle numeric string version IDs', async () => {
      const mockResource = {
        id: resourceId,
        resourceType: resourceType,
        meta: { versionId: 10 }
      }

      const updatedResource = { id: resourceId, resourceType: resourceType }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute(resourceType, resourceId)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType, id: resourceId },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '11',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )
    })
  })

  describe('updateResource (private method behavior)', () => {
    it('should call findOneAndUpdate with correct parameters', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute('Patient', 'patient-123')

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceType: 'Patient', id: 'patient-123' },
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': '2',
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        { new: true }
      )
    })

    it('should use new: true option for findOneAndUpdate', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute('Patient', 'patient-123')

      const findOneAndUpdateCall = mockModel.findOneAndUpdate.mock.calls[0]
      expect(findOneAndUpdateCall[2]).toEqual({ new: true })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string parameters', async () => {
      mockModel.findOne.mockResolvedValue(null)

      await expect(deleteOperation.execute('', ''))
        .rejects
        .toThrow(NotFoundException)
    })

    it('should handle null parameters', async () => {
      mockModel.findOne.mockResolvedValue(null)

      await expect(deleteOperation.execute(null as any, null as any))
        .rejects
        .toThrow(NotFoundException)
    })

    it('should handle undefined parameters', async () => {
      mockModel.findOne.mockResolvedValue(null)

      await expect(deleteOperation.execute(undefined as any, undefined as any))
        .rejects
        .toThrow(NotFoundException)
    })

    it('should handle very long resource IDs', async () => {
      const longId = 'a'.repeat(1000)
      const mockResource = {
        id: longId,
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: longId, resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      const result = await deleteOperation.execute('Patient', longId)

      expect(result.issue[0].details.text).toBe(`Patient/${longId} has been deleted`)
    })

    it('should maintain async method signature', () => {
      expect(typeof deleteOperation.execute).toBe('function')
      expect(deleteOperation.execute.constructor.name).toBe('AsyncFunction')
    })

    it('should return Promise from execute method', () => {
      mockModel.findOne.mockResolvedValue(null)

      const resultPromise = deleteOperation.execute('Patient', 'patient-123')
        .catch(() => {}) // Catch the expected error

      expect(resultPromise).toBeInstanceOf(Promise)
    })
  })

  describe('FHIR Compliance', () => {
    it('should return valid OperationOutcome on success', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      const result = await deleteOperation.execute('Patient', 'patient-123')

      expect(result).toHaveProperty('resourceType', 'OperationOutcome')
      expect(result).toHaveProperty('issue')
      expect(Array.isArray(result.issue)).toBe(true)
      expect(result.issue).toHaveLength(1)
      expect(result.issue[0]).toHaveProperty('severity', 'information')
      expect(result.issue[0]).toHaveProperty('code', 'deleted')
      expect(result.issue[0]).toHaveProperty('details')
      expect(result.issue[0].details).toHaveProperty('text')
    })

    it('should implement soft delete pattern', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        status: 'active',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute('Patient', 'patient-123')

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        {
          $set: {
            status: 'inactive',
            'resource.meta.versionId': expect.any(String),
            'resource.meta.lastUpdated': expect.any(Date)
          },
          $push: {
            tags: 'deleted'
          }
        },
        expect.anything()
      )
    })

    it('should increment version ID following FHIR versioning', async () => {
      const testVersions = ['1', '10', '999', '0']

      for (const version of testVersions) {
        const mockResource = {
          id: 'patient-123',
          resourceType: 'Patient',
          meta: { versionId: version }
        }

        const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

        mockModel.findOne.mockResolvedValue(mockResource as any)
        mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

        await deleteOperation.execute('Patient', 'patient-123')

        const expectedVersion = String(parseInt(version) + 1)
        expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            $set: expect.objectContaining({
              'resource.meta.versionId': expectedVersion
            })
          }),
          expect.anything()
        )

        mockModel.findOne.mockClear()
        mockModel.findOneAndUpdate.mockClear()
      }
    })

    it('should update lastUpdated timestamp', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      const startTime = new Date()
      await deleteOperation.execute('Patient', 'patient-123')
      const endTime = new Date()

      const updateCall = mockModel.findOneAndUpdate.mock.calls[0][1]
      const lastUpdated = updateCall?.$set?.['resource.meta.lastUpdated']

      expect(lastUpdated).toBeInstanceOf(Date)
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(startTime.getTime())
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(endTime.getTime())
    })

    it('should add deleted tag for resource tracking', async () => {
      const mockResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = { id: 'patient-123', resourceType: 'Patient' }

      mockModel.findOne.mockResolvedValue(mockResource as any)
      mockModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)

      await deleteOperation.execute('Patient', 'patient-123')

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $push: {
            tags: 'deleted'
          }
        }),
        expect.anything()
      )
    })
  })
})