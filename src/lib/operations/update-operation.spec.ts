import { UpdateOperation } from './update-operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { Model } from 'mongoose'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { FhirResponse } from '../fhir-response'

jest.mock('../fhir-response')

describe('UpdateOperation', () => {
  let updateOperation: UpdateOperation
  let mockFhirResourceModel: jest.Mocked<Model<FhirResourceDocument>>
  let mockFhirResponse: jest.Mocked<typeof FhirResponse>

  beforeEach(() => {
    mockFhirResourceModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn()
    } as any

    mockFhirResponse = FhirResponse as jest.Mocked<typeof FhirResponse>

    updateOperation = new UpdateOperation(mockFhirResourceModel)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create an instance with the provided model', () => {
      expect(updateOperation).toBeInstanceOf(UpdateOperation)
      expect(updateOperation.fhirResourceModel).toBe(mockFhirResourceModel)
    })

    it('should extend the base Operation class', () => {
      expect(updateOperation).toHaveProperty('exists')
    })
  })

  describe('execute', () => {
    const resourceType = 'Patient'
    const resourceId = 'patient-123'
    const resourceData = {
      resourceType: 'Patient',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1980-01-01',
      active: true,
      meta: {}
    }

    describe('Successful updates', () => {
      it('should update existing resource without version conflict', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          name: [{ family: 'Smith', given: ['Jane'] }],
          meta: {
            versionId: '1',
            lastUpdated: new Date('2023-01-01T00:00:00Z')
          }
        }

        const updatedResource = {
          id: resourceId,
          resourceType: resourceType,
          name: [{ family: 'Doe', given: ['John'] }],
          gender: 'male',
          birthDate: '1980-01-01',
          active: true,
          meta: {
            versionId: '2',
            lastUpdated: new Date()
          }
        }

        const formattedResource = { ...updatedResource, formatted: true }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await updateOperation.execute(resourceType, resourceId, resourceData)

        expect(mockFhirResourceModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: resourceId
        })

        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
          { id: resourceId, resourceType: resourceType },
          {
            $set: {
              ...resourceData,
              resourceType: resourceType,
              id: resourceId,
              meta: {
                versionId: '2',
                lastUpdated: expect.any(Date)
              }
            }
          },
          {
            new: true,
            lean: true,
            runValidators: false,
            select: '-_id'
          }
        )

        expect(mockFhirResponse.format).toHaveBeenCalledWith(updatedResource)
        expect(result).toEqual(formattedResource)
      })

      it('should update resource with matching version ID', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '3',
            lastUpdated: new Date('2023-01-01T00:00:00Z')
          }
        }

        const resourceDataWithVersion = {
          ...resourceData,
          meta: {
            versionId: '3'
          }
        }

        const updatedResource = {
          ...resourceDataWithVersion,
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '4',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, resourceDataWithVersion)

        expect(result).toEqual(updatedResource)
      })

      it('should handle resource with undefined version ID', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          name: [{ family: 'Smith' }],
          meta: {
            versionId: undefined
          }
        }

        const updatedResource = {
          ...resourceData,
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: 'NaN',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, resourceData)

        // When versionId is undefined, parseInt(undefined) + 1 = NaN, String(NaN) = 'NaN'
        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
          { id: resourceId, resourceType: resourceType },
          {
            $set: expect.objectContaining({
              meta: expect.objectContaining({
                versionId: 'NaN'
              })
            })
          },
          expect.any(Object)
        )

        expect(result).toEqual(updatedResource)
      })

      it('should handle different resource types', async () => {
        const testCases = [
          { type: 'Observation', id: 'obs-123' },
          { type: 'Encounter', id: 'enc-456' },
          { type: 'Practitioner', id: 'prac-789' },
          { type: 'Organization', id: 'org-101' }
        ]

        for (const testCase of testCases) {
          const existingResource = {
            id: testCase.id,
            resourceType: testCase.type,
            meta: { versionId: '1' }
          }

          const testResourceData = {
            resourceType: testCase.type,
            status: 'active',
            meta: {}
          }

          const updatedResource = {
            ...testResourceData,
            id: testCase.id,
            resourceType: testCase.type,
            meta: {
              versionId: '2',
              lastUpdated: new Date()
            }
          }

          mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
          mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
          mockFhirResponse.format.mockReturnValue(updatedResource)

          const result = await updateOperation.execute(testCase.type, testCase.id, testResourceData)

          expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
            { id: testCase.id, resourceType: testCase.type },
            expect.any(Object),
            expect.any(Object)
          )

          expect(result).toEqual(updatedResource)

          // Clear mocks for next iteration
          mockFhirResourceModel.findOne.mockClear()
          mockFhirResourceModel.findOneAndUpdate.mockClear()
          mockFhirResponse.format.mockClear()
        }
      })

      it('should preserve additional metadata fields', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '1',
            lastUpdated: new Date('2023-01-01T00:00:00Z'),
            profile: ['http://example.org/StructureDefinition/MyPatient'],
            security: [{ system: 'http://example.org', code: 'test' }]
          }
        }

        const resourceDataWithMeta = {
          ...resourceData,
          meta: {
            profile: ['http://example.org/StructureDefinition/UpdatedPatient'],
            tag: [{ system: 'http://example.org', code: 'updated' }]
          }
        }

        const updatedResource = {
          ...resourceDataWithMeta,
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '2',
            lastUpdated: new Date(),
            profile: ['http://example.org/StructureDefinition/UpdatedPatient'],
            tag: [{ system: 'http://example.org', code: 'updated' }]
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, resourceDataWithMeta)

        expect(result).toEqual(updatedResource)
      })
    })

    describe('Version conflict handling', () => {
      it('should throw ConflictException when version IDs do not match', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '5',
            lastUpdated: new Date('2023-01-01T00:00:00Z')
          }
        }

        const resourceDataWithConflictingVersion = {
          ...resourceData,
          meta: {
            versionId: '3'
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)

        await expect(updateOperation.execute(resourceType, resourceId, resourceDataWithConflictingVersion))
          .rejects
          .toThrow(ConflictException)

        const error = await updateOperation.execute(resourceType, resourceId, resourceDataWithConflictingVersion)
          .catch(err => err)

        expect(error).toBeInstanceOf(ConflictException)
        expect(error.getResponse()).toEqual({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'conflict',
            details: {
              text: 'Version conflict. Expected version 5, but received 3'
            }
          }]
        })
      })

      it('should not perform update when version conflict occurs', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '2' }
        }

        const resourceDataWithConflictingVersion = {
          ...resourceData,
          meta: { versionId: '1' }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)

        await updateOperation.execute(resourceType, resourceId, resourceDataWithConflictingVersion)
          .catch(() => {}) // Expected to throw

        expect(mockFhirResourceModel.findOneAndUpdate).not.toHaveBeenCalled()
        expect(mockFhirResponse.format).not.toHaveBeenCalled()
      })

      it('should handle string vs numeric version ID comparison', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '10' }
        }

        const resourceDataWithStringVersion = {
          ...resourceData,
          meta: { versionId: '9' }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)

        await expect(updateOperation.execute(resourceType, resourceId, resourceDataWithStringVersion))
          .rejects
          .toThrow(ConflictException)
      })

      it('should handle case where existing resource has no meta', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: undefined
        }

        const resourceDataWithVersion = {
          ...resourceData,
          meta: { versionId: '1' }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)

        // This should throw an error when trying to access undefined.versionId
        await expect(updateOperation.execute(resourceType, resourceId, resourceDataWithVersion))
          .rejects
          .toThrow()
      })

      it('should not check version when resource data has no version ID', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '5' }
        }

        const updatedResource = {
          ...resourceData,
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '6',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        // resourceData has no meta.versionId, so no version check should occur
        const result = await updateOperation.execute(resourceType, resourceId, resourceData)

        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalled()
        expect(result).toEqual(updatedResource)
      })
    })

    describe('Resource not found', () => {
      it('should throw NotFoundException when resource does not exist', async () => {
        mockFhirResourceModel.findOne.mockResolvedValue(null)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow(NotFoundException)

        const error = await updateOperation.execute(resourceType, resourceId, resourceData)
          .catch(err => err)

        expect(error).toBeInstanceOf(NotFoundException)
        expect(error.getResponse()).toEqual({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `${resourceType}/${resourceId} can not be updated, cos it does not exists`
            }
          }]
        })
      })

      it('should throw NotFoundException when resource is undefined', async () => {
        mockFhirResourceModel.findOne.mockResolvedValue(undefined)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow(NotFoundException)
      })

      it('should not perform update when resource does not exist', async () => {
        mockFhirResourceModel.findOne.mockResolvedValue(null)

        await updateOperation.execute(resourceType, resourceId, resourceData)
          .catch(() => {}) // Expected to throw

        expect(mockFhirResourceModel.findOneAndUpdate).not.toHaveBeenCalled()
        expect(mockFhirResponse.format).not.toHaveBeenCalled()
      })
    })

    describe('Update operation failures', () => {
      it('should throw error when findOneAndUpdate returns null', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(null)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow('Failed to update resource')
      })

      it('should throw error when findOneAndUpdate returns undefined', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(undefined)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow('Failed to update resource')
      })

      it('should propagate database errors from exists check', async () => {
        const databaseError = new Error('Database connection failed')
        mockFhirResourceModel.findOne.mockRejectedValue(databaseError)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow('Database connection failed')
      })

      it('should propagate database errors from update operation', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const updateError = new Error('Update operation failed')
        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockRejectedValue(updateError)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow('Update operation failed')
      })

      it('should handle mongoose validation errors', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const validationError = new Error('Validation failed')
        validationError.name = 'ValidationError'
        
        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockRejectedValue(validationError)

        await expect(updateOperation.execute(resourceType, resourceId, resourceData))
          .rejects
          .toThrow('Validation failed')
      })
    })

    describe('Edge cases', () => {
      it('should handle special characters in resource IDs', async () => {
        const specialIds = [
          'patient-with-dashes',
          'patient_with_underscores',
          'patient.with.dots',
          'PATIENT-CAPS',
          'patient-123-ñíño'
        ]

        for (const specialId of specialIds) {
          const existingResource = {
            id: specialId,
            resourceType: resourceType,
            meta: { versionId: '1' }
          }

          const updatedResource = {
            ...resourceData,
            id: specialId,
            resourceType: resourceType,
            meta: { versionId: '2', lastUpdated: new Date() }
          }

          mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
          mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
          mockFhirResponse.format.mockReturnValue(updatedResource)

          const result = await updateOperation.execute(resourceType, specialId, resourceData)

          expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
            { id: specialId, resourceType: resourceType },
            expect.any(Object),
            expect.any(Object)
          )

          expect(result).toEqual(updatedResource)

          // Clear mocks for next iteration
          mockFhirResourceModel.findOne.mockClear()
          mockFhirResourceModel.findOneAndUpdate.mockClear()
          mockFhirResponse.format.mockClear()
        }
      })

      it('should handle very large version numbers', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '999999999' }
        }

        const updatedResource = {
          ...resourceData,
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '1000000000',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, resourceData)

        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
          expect.any(Object),
          {
            $set: expect.objectContaining({
              meta: expect.objectContaining({
                versionId: '1000000000'
              })
            })
          },
          expect.any(Object)
        )

        expect(result).toEqual(updatedResource)
      })

      it('should handle empty resource data', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const emptyResourceData = { meta: {} }

        const updatedResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '2',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, emptyResourceData)

        expect(result).toEqual(updatedResource)
      })

      it('should handle null resource data', async () => {
        const existingResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const updatedResource = {
          id: resourceId,
          resourceType: resourceType,
          meta: {
            versionId: '2',
            lastUpdated: new Date()
          }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        const result = await updateOperation.execute(resourceType, resourceId, { meta: {} })

        expect(result).toEqual(updatedResource)
      })
    })

    describe('Concurrent updates', () => {
      it('should handle concurrent update operations', async () => {
        const resource1 = { ...resourceData, id: 'patient-1' }
        const resource2 = { ...resourceData, id: 'patient-2' }

        const existingResource1 = {
          id: 'patient-1',
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const existingResource2 = {
          id: 'patient-2',
          resourceType: resourceType,
          meta: { versionId: '1' }
        }

        const updatedResource1 = {
          ...resource1,
          resourceType: resourceType,
          meta: { versionId: '2', lastUpdated: new Date() }
        }

        const updatedResource2 = {
          ...resource2,
          resourceType: resourceType,
          meta: { versionId: '2', lastUpdated: new Date() }
        }

        mockFhirResourceModel.findOne
          .mockResolvedValueOnce(existingResource1 as any)
          .mockResolvedValueOnce(existingResource2 as any)

        mockFhirResourceModel.findOneAndUpdate
          .mockResolvedValueOnce(updatedResource1 as any)
          .mockResolvedValueOnce(updatedResource2 as any)

        mockFhirResponse.format
          .mockReturnValueOnce(updatedResource1)
          .mockReturnValueOnce(updatedResource2)

        const [result1, result2] = await Promise.all([
          updateOperation.execute(resourceType, 'patient-1', resource1),
          updateOperation.execute(resourceType, 'patient-2', resource2)
        ])

        expect(result1).toEqual(updatedResource1)
        expect(result2).toEqual(updatedResource2)
        expect(mockFhirResourceModel.findOne).toHaveBeenCalledTimes(2)
        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('prepareResourceForUpdate', () => {
    it('should merge resource data with resourceType and id', () => {
      const resourceType = 'Patient'
      const resourceId = 'patient-123'
      const resourceData = {
        name: [{ family: 'Doe', given: ['John'] }],
        gender: 'male'
      }

      // Access private method through any cast for testing
      const result = (updateOperation as any).prepareResourceForUpdate(resourceType, resourceId, resourceData)

      expect(result).toEqual({
        name: [{ family: 'Doe', given: ['John'] }],
        gender: 'male',
        resourceType: resourceType,
        id: resourceId
      })
    })

    it('should override resourceType and id if they exist in resource data', () => {
      const resourceType = 'Patient'
      const resourceId = 'patient-123'
      const resourceData = {
        resourceType: 'Observation',
        id: 'different-id',
        status: 'final'
      }

      const result = (updateOperation as any).prepareResourceForUpdate(resourceType, resourceId, resourceData)

      expect(result).toEqual({
        resourceType: resourceType, // Should override
        id: resourceId, // Should override
        status: 'final'
      })
    })

    it('should handle null resource data', () => {
      const resourceType = 'Patient'
      const resourceId = 'patient-123'

      const result = (updateOperation as any).prepareResourceForUpdate(resourceType, resourceId, null)

      expect(result).toEqual({
        resourceType: resourceType,
        id: resourceId
      })
    })

    it('should handle undefined resource data', () => {
      const resourceType = 'Patient'
      const resourceId = 'patient-123'

      const result = (updateOperation as any).prepareResourceForUpdate(resourceType, resourceId, undefined)

      expect(result).toEqual({
        resourceType: resourceType,
        id: resourceId
      })
    })
  })

  describe('Method behavior validation', () => {
    it('should maintain async method signature', () => {
      expect(typeof updateOperation.execute).toBe('function')
      expect(updateOperation.execute.constructor.name).toBe('AsyncFunction')
    })

    it('should return Promise from execute method', () => {
      mockFhirResourceModel.findOne.mockResolvedValue(null)

      const resultPromise = updateOperation.execute('Patient', 'patient-123', { meta: {} })
        .catch(() => {}) // Expected to throw NotFoundException

      expect(resultPromise).toBeInstanceOf(Promise)
    })

    it('should call exists method from base Operation class', async () => {
      const resourceType = 'Patient'
      const resourceId = 'patient-123'

      mockFhirResourceModel.findOne.mockResolvedValue(null)

      await updateOperation.execute(resourceType, resourceId, { meta: {} })
        .catch(() => {}) // Expected to throw

      expect(mockFhirResourceModel.findOne).toHaveBeenCalledWith({
        resourceType: resourceType,
        id: resourceId
      })
    })
  })

  describe('Integration with FhirResponse', () => {
    it('should call FhirResponse.format with updated resource', async () => {
      const existingResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        name: [{ family: 'Doe' }],
        meta: { versionId: '2', lastUpdated: new Date() }
      }

      mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
      mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
      mockFhirResponse.format.mockReturnValue(updatedResource)

      await updateOperation.execute('Patient', 'patient-123', { name: [{ family: 'Doe' }], meta: {} })

      expect(mockFhirResponse.format).toHaveBeenCalledWith(updatedResource)
      expect(mockFhirResponse.format).toHaveBeenCalledTimes(1)
    })

    it('should return the result from FhirResponse.format', async () => {
      const existingResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      const updatedResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '2', lastUpdated: new Date() }
      }

      const formattedResponse = { ...updatedResource, formatted: true }

      mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
      mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
      mockFhirResponse.format.mockReturnValue(formattedResponse)

      const result = await updateOperation.execute('Patient', 'patient-123', { meta: {} })

      expect(result).toEqual(formattedResponse)
      expect(result).toHaveProperty('formatted', true)
    })
  })

  describe('FHIR compliance', () => {
    it('should increment version ID by 1', async () => {
      const testVersions = [
        { current: '1', expected: '2' },
        { current: '10', expected: '11' },
        { current: '999', expected: '1000' },
        { current: '0', expected: '1' }
      ]

      for (const testVersion of testVersions) {
        const existingResource = {
          id: 'patient-123',
          resourceType: 'Patient',
          meta: { versionId: testVersion.current }
        }

        const updatedResource = {
          id: 'patient-123',
          resourceType: 'Patient',
          meta: { versionId: testVersion.expected, lastUpdated: new Date() }
        }

        mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
        mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
        mockFhirResponse.format.mockReturnValue(updatedResource)

        await updateOperation.execute('Patient', 'patient-123', { meta: {} })

        expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
          expect.any(Object),
          {
            $set: expect.objectContaining({
              meta: expect.objectContaining({
                versionId: testVersion.expected
              })
            })
          },
          expect.any(Object)
        )

        // Clear mocks for next iteration
        mockFhirResourceModel.findOne.mockClear()
        mockFhirResourceModel.findOneAndUpdate.mockClear()
        mockFhirResponse.format.mockClear()
      }
    })

    it('should update lastUpdated timestamp', async () => {
      const existingResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: {
          versionId: '1',
          lastUpdated: new Date('2023-01-01T00:00:00Z')
        }
      }

      const updatedResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '2', lastUpdated: new Date() }
      }

      mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
      mockFhirResourceModel.findOneAndUpdate.mockResolvedValue(updatedResource as any)
      mockFhirResponse.format.mockReturnValue(updatedResource)

      const startTime = new Date()
      await updateOperation.execute('Patient', 'patient-123', { meta: {} })
      const endTime = new Date()

      const updateCall = mockFhirResourceModel.findOneAndUpdate.mock.calls[0][1]
      const lastUpdated = updateCall?.$set?.meta?.lastUpdated

      expect(lastUpdated).toBeInstanceOf(Date)
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(startTime.getTime())
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(endTime.getTime())
    })

    it('should use correct MongoDB update options', async () => {
      const existingResource = {
        id: 'patient-123',
        resourceType: 'Patient',
        meta: { versionId: '1' }
      }

      mockFhirResourceModel.findOne.mockResolvedValue(existingResource as any)
      mockFhirResourceModel.findOneAndUpdate.mockResolvedValue({} as any)
      mockFhirResponse.format.mockReturnValue({})

      await updateOperation.execute('Patient', 'patient-123', { meta: {} })

      expect(mockFhirResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        {
          new: true,
          lean: true,
          runValidators: false,
          select: '-_id'
        }
      )
    })
  })
})