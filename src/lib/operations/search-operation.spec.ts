import { SearchOperation } from './search-operation'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema'
import { Model } from 'mongoose'
import { Request } from 'express'
import { NotFoundException } from '@nestjs/common'
import { FhirResponse } from '../fhir-response'
import { SearchParameters } from '../../interfaces/search-parameters'
import { IncludeOperation } from './include-operation'
import { RevIncludeOperation } from './rev-include-operation'
import { QueryBuilder } from '../query-builder/query-builder'

jest.mock('../fhir-response')
jest.mock('./include-operation')
jest.mock('./rev-include-operation')
jest.mock('../query-builder/query-builder')

describe('SearchOperation', () => {
  let searchOperation: SearchOperation
  let mockFhirResourceModel: jest.Mocked<Model<FhirResourceDocument>>
  let mockStructureDefinitionModel: jest.Mocked<Model<StructureDefinitionDocument>>
  let mockRequest: jest.Mocked<Request>
  let mockFhirResponse: jest.Mocked<typeof FhirResponse>
  let mockIncludeOperation: jest.MockedClass<typeof IncludeOperation>
  let mockRevIncludeOperation: jest.MockedClass<typeof RevIncludeOperation>
  let mockQueryBuilder: jest.MockedClass<typeof QueryBuilder>

  beforeEach(() => {
    mockFhirResourceModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn()
    } as any

    mockStructureDefinitionModel = {} as any

    mockRequest = {
      url: '/fhir/Patient',
      query: {},
      get: jest.fn()
    } as any

    mockFhirResponse = FhirResponse as jest.Mocked<typeof FhirResponse>
    mockIncludeOperation = IncludeOperation as jest.MockedClass<typeof IncludeOperation>
    mockRevIncludeOperation = RevIncludeOperation as jest.MockedClass<typeof RevIncludeOperation>
    mockQueryBuilder = QueryBuilder as jest.MockedClass<typeof QueryBuilder>

    searchOperation = new SearchOperation(
      mockFhirResourceModel,
      mockRequest,
      mockStructureDefinitionModel
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create an instance with default values', () => {
      expect(searchOperation).toBeInstanceOf(SearchOperation)
      expect(searchOperation.count).toBe(20)
      expect(searchOperation.offset).toBe(0)
      expect(searchOperation.filter).toEqual({ resourceType: 'Patient' })
      expect(searchOperation.includes).toEqual([])
      expect(searchOperation.revIncludes).toEqual([])
      expect(searchOperation.request).toBe(mockRequest)
    })

    it('should extend the base Operation class', () => {
      expect(searchOperation).toHaveProperty('exists')
      expect(searchOperation.fhirResourceModel).toBe(mockFhirResourceModel)
    })

    it('should store the structure definition model', () => {
      expect(searchOperation['structureDefinitonModel']).toBe(mockStructureDefinitionModel)
    })
  })

  describe('findById', () => {
    const resourceType = 'Patient'
    const resourceId = 'patient-123'

    beforeEach(() => {
      // Create chain mocks for findOne
      const mockSelect = {
        lean: jest.fn()
      }
      const mockFindOne = {
        select: jest.fn().mockReturnValue(mockSelect)
      }
      mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)
    })

    describe('Successful resource retrieval', () => {
      it('should return formatted resource when found without includes', async () => {
        const mockResource = {
          id: resourceId,
          resourceType: resourceType,
          name: [{ family: 'Doe', given: ['John'] }]
        }
        const formattedResource = { ...mockResource, formatted: true }

        // Mock QueryBuilder
        const mockQBInstance = {
          projection: { name: 1, id: 1 }
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock FhirResponse
        mockFhirResponse.format.mockReturnValue(formattedResource)

        const result = await searchOperation.findById(resourceType, resourceId)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceType, undefined, resourceId)
        expect(mockFhirResourceModel.findOne).toHaveBeenCalledWith({
          resourceType: resourceType,
          id: resourceId
        })
        expect(mockFindOne.select).toHaveBeenCalledWith(mockQBInstance.projection)
        expect(mockSelect.lean).toHaveBeenCalled()
        expect(mockFhirResponse.format).toHaveBeenCalledWith(mockResource)
        expect(result).toEqual(formattedResource)
      })

      it('should handle search parameters with projection', async () => {
        const searchParams: SearchParameters = {
          _elements: 'name,birthDate'
        }
        const mockResource = {
          id: resourceId,
          resourceType: resourceType,
          name: [{ family: 'Doe' }],
          birthDate: '1980-01-01'
        }

        // Mock QueryBuilder with custom projection
        const mockQBInstance = {
          projection: { name: 1, birthDate: 1, id: 1 }
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        mockFhirResponse.format.mockReturnValue(mockResource)

        const result = await searchOperation.findById(resourceType, resourceId, searchParams)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceType, searchParams, resourceId)
        expect(mockFindOne.select).toHaveBeenCalledWith(mockQBInstance.projection)
        expect(result).toEqual(mockResource)
      })

      it('should process _include parameters', async () => {
        const searchParams: SearchParameters = {
          _include: 'Patient:general-practitioner'
        }
        const mockResource = {
          id: resourceId,
          resourceType: resourceType,
          generalPractitioner: [{ reference: 'Practitioner/prac-123' }]
        }
        const mockIncludedResources = [
          { id: 'prac-123', resourceType: 'Practitioner', name: [{ family: 'Smith' }] }
        ]

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock IncludeOperation
        const mockIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockIncludedResources)
        }
        mockIncludeOperation.mockImplementation(() => mockIncludeInstance as any)

        const mockConcatenatedResponse = {
          resourceType: 'Bundle',
          entry: [mockResource, ...mockIncludedResources]
        }
        mockFhirResponse.concat.mockReturnValue(mockConcatenatedResponse)

        const result = await searchOperation.findById(resourceType, resourceId, searchParams)

        expect(mockIncludeOperation).toHaveBeenCalledWith(
          mockResource,
          mockFhirResourceModel,
          mockRequest
        )
        expect(mockIncludeInstance.execute).toHaveBeenCalledWith(searchParams._include)
        expect(searchOperation.includes).toEqual(mockIncludedResources)
        expect(mockFhirResponse.concat).toHaveBeenCalledWith(
          mockResource,
          mockIncludedResources,
          mockRequest
        )
        expect(result).toEqual(mockConcatenatedResponse)
      })

      it('should process _revinclude parameters', async () => {
        const searchParams: SearchParameters = {
          _revinclude: 'Observation:patient'
        }
        const mockResource = {
          id: resourceId,
          resourceType: resourceType
        }
        const mockRevIncludedResources = [
          { id: 'obs-123', resourceType: 'Observation', subject: { reference: 'Patient/patient-123' } }
        ]

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock RevIncludeOperation
        const mockRevIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockRevIncludedResources)
        }
        mockRevIncludeOperation.mockImplementation(() => mockRevIncludeInstance as any)

        const mockConcatenatedResponse = {
          resourceType: 'Bundle',
          entry: [mockResource, ...mockRevIncludedResources]
        }
        mockFhirResponse.concat.mockReturnValue(mockConcatenatedResponse)

        const result = await searchOperation.findById(resourceType, resourceId, searchParams)

        expect(mockRevIncludeOperation).toHaveBeenCalledWith(
          mockResource,
          mockFhirResourceModel,
          mockRequest
        )
        expect(mockRevIncludeInstance.execute).toHaveBeenCalledWith(searchParams._revinclude)
        expect(searchOperation.revIncludes).toEqual(mockRevIncludedResources)
        expect(mockFhirResponse.concat).toHaveBeenCalledWith(
          mockResource,
          mockRevIncludedResources,
          mockRequest
        )
        expect(result).toEqual(mockConcatenatedResponse)
      })

      it('should return concatenated response when includes/revIncludes exist', async () => {
        const searchParams: SearchParameters = {
          _include: 'Patient:general-practitioner',
          _revinclude: 'Observation:patient'
        }
        const mockResource = {
          id: resourceId,
          resourceType: resourceType
        }
        const mockIncludedResources = [{ id: 'prac-123', resourceType: 'Practitioner' }]
        const mockRevIncludedResources = [{ id: 'obs-123', resourceType: 'Observation' }]
        const mockConcatenatedResponse = {
          resourceType: 'Bundle',
          entry: [mockResource, ...mockIncludedResources, ...mockRevIncludedResources]
        }

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock operations
        const mockIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockIncludedResources)
        }
        mockIncludeOperation.mockImplementation(() => mockIncludeInstance as any)

        const mockRevIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockRevIncludedResources)
        }
        mockRevIncludeOperation.mockImplementation(() => mockRevIncludeInstance as any)

        mockFhirResponse.concat.mockReturnValue(mockConcatenatedResponse)

        const result = await searchOperation.findById(resourceType, resourceId, searchParams)

        expect(mockFhirResponse.concat).toHaveBeenCalledWith(
          mockResource,
          [...mockIncludedResources, ...mockRevIncludedResources],
          mockRequest
        )
        expect(result).toEqual(mockConcatenatedResponse)
      })

      it('should handle both _include and _revinclude parameters', async () => {
        const searchParams: SearchParameters = {
          _include: ['Patient:general-practitioner', 'Patient:organization'],
          _revinclude: ['Observation:patient', 'Encounter:patient']
        }
        const mockResource = { id: resourceId, resourceType: resourceType }
        const mockIncludedResources = [{ id: 'prac-123' }, { id: 'org-456' }]
        const mockRevIncludedResources = [{ id: 'obs-123' }, { id: 'enc-456' }]

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock operations
        const mockIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockIncludedResources)
        }
        mockIncludeOperation.mockImplementation(() => mockIncludeInstance as any)

        const mockRevIncludeInstance = {
          execute: jest.fn().mockResolvedValue(mockRevIncludedResources)
        }
        mockRevIncludeOperation.mockImplementation(() => mockRevIncludeInstance as any)

        const mockConcatenatedResponse = { resourceType: 'Bundle' }
        mockFhirResponse.concat.mockReturnValue(mockConcatenatedResponse)

        const result = await searchOperation.findById(resourceType, resourceId, searchParams)

        expect(mockIncludeInstance.execute).toHaveBeenCalledWith(searchParams._include)
        expect(mockRevIncludeInstance.execute).toHaveBeenCalledWith(searchParams._revinclude)
        expect(mockFhirResponse.concat).toHaveBeenCalledWith(
          mockResource,
          [...mockIncludedResources, ...mockRevIncludedResources],
          mockRequest
        )
        expect(result).toEqual(mockConcatenatedResponse)
      })
    })

    describe('Resource not found', () => {
      it('should throw NotFoundException when resource is not found', async () => {
        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query to return null
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(null)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        await expect(searchOperation.findById(resourceType, resourceId))
          .rejects
          .toThrow(NotFoundException)

        const error = await searchOperation.findById(resourceType, resourceId)
          .catch(err => err)

        expect(error).toBeInstanceOf(NotFoundException)
        expect(error.getResponse()).toEqual({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `${resourceType}/${resourceId} not found`
            }
          }]
        })
      })

      it('should throw NotFoundException when resource is undefined', async () => {
        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock database query to return undefined
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(undefined)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        await expect(searchOperation.findById(resourceType, resourceId))
          .rejects
          .toThrow(NotFoundException)
      })
    })

    describe('Error handling', () => {
      it('should propagate database errors', async () => {
        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        const databaseError = new Error('Database connection failed')
        const mockSelect = {
          lean: jest.fn().mockRejectedValue(databaseError)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        await expect(searchOperation.findById(resourceType, resourceId))
          .rejects
          .toThrow('Database connection failed')
      })

      it('should handle errors from IncludeOperation', async () => {
        const searchParams: SearchParameters = { _include: 'Patient:general-practitioner' }
        const mockResource = { id: resourceId, resourceType: resourceType }

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock successful database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock IncludeOperation to throw error
        const includeError = new Error('Include operation failed')
        const mockIncludeInstance = {
          execute: jest.fn().mockRejectedValue(includeError)
        }
        mockIncludeOperation.mockImplementation(() => mockIncludeInstance as any)

        await expect(searchOperation.findById(resourceType, resourceId, searchParams))
          .rejects
          .toThrow('Include operation failed')
      })

      it('should handle errors from RevIncludeOperation', async () => {
        const searchParams: SearchParameters = { _revinclude: 'Observation:patient' }
        const mockResource = { id: resourceId, resourceType: resourceType }

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

        // Mock successful database query
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResource)
        }
        const mockFindOne = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

        // Mock RevIncludeOperation to throw error
        const revIncludeError = new Error('RevInclude operation failed')
        const mockRevIncludeInstance = {
          execute: jest.fn().mockRejectedValue(revIncludeError)
        }
        mockRevIncludeOperation.mockImplementation(() => mockRevIncludeInstance as any)

        await expect(searchOperation.findById(resourceType, resourceId, searchParams))
          .rejects
          .toThrow('RevInclude operation failed')
      })
    })
  })

  describe('find', () => {
    const resourceType = 'Patient'

    beforeEach(() => {
      // Create chain mocks for find
      const mockSelect = {
        lean: jest.fn()
      }
      const mockSort = {
        select: jest.fn().mockReturnValue(mockSelect)
      }
      const mockLimit = {
        sort: jest.fn().mockReturnValue(mockSort)
      }
      const mockSkip = {
        limit: jest.fn().mockReturnValue(mockLimit)
      }
      const mockFind = {
        skip: jest.fn().mockReturnValue(mockSkip)
      }
      mockFhirResourceModel.find.mockReturnValue(mockFind as any)
    })

    describe('Successful search', () => {
      it('should return bundle with search results', async () => {
        const searchParams: SearchParameters = {
          _count: 10,
          _offset: 0
        }
        const mockResources = [
          { id: 'patient-1', resourceType: 'Patient', name: [{ family: 'Doe' }] },
          { id: 'patient-2', resourceType: 'Patient', name: [{ family: 'Smith' }] }
        ]
        const mockBundle = {
          resourceType: 'Bundle',
          total: 2,
          entry: mockResources.map(resource => ({ resource }))
        }

        // Mock QueryBuilder
        const mockQBInstance = {
          condition: { resourceType: 'Patient' },
          offset: 0,
          count: 10,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResources)
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(2)

        mockFhirResponse.bundle.mockReturnValue(mockBundle)

        const result = await searchOperation.find(resourceType, searchParams)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceType, searchParams)
        expect(mockFhirResourceModel.find).toHaveBeenCalledWith(mockQBInstance.condition)
        expect(mockSkip.limit).toHaveBeenCalledWith(mockQBInstance.count)
        expect(mockFind.skip).toHaveBeenCalledWith(mockQBInstance.offset)
        expect(mockLimit.sort).toHaveBeenCalledWith(mockQBInstance.sort)
        expect(mockSort.select).toHaveBeenCalledWith(mockQBInstance.projection)
        expect(mockSelect.lean).toHaveBeenCalled()
        expect(mockFhirResourceModel.countDocuments).toHaveBeenCalledWith(mockQBInstance.condition)
        expect(mockFhirResponse.bundle).toHaveBeenCalledWith(
          mockResources,
          2,
          mockQBInstance.offset,
          mockQBInstance.count,
          mockRequest
        )
        expect(result).toEqual(mockBundle)
      })

      it('should handle empty search results', async () => {
        const searchParams: SearchParameters = {}
        const mockBundle = {
          resourceType: 'Bundle',
          total: 0,
          entry: []
        }

        // Mock QueryBuilder
        const mockQBInstance = {
          condition: { resourceType: 'Patient' },
          offset: 0,
          count: 20,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue(mockBundle)

        const result = await searchOperation.find(resourceType, searchParams)

        expect(result).toEqual(mockBundle)
      })

      it('should handle search with complex conditions', async () => {
        const searchParams: SearchParameters = {
          identifier: 'system|value',
          _tag: 'test',
          _profile: 'http://example.org/StructureDefinition/MyPatient'
        }

        // Mock QueryBuilder with complex condition
        const mockQBInstance = {
          condition: {
            resourceType: 'Patient',
            'identifier.system': 'system',
            'identifier.value': 'value',
            'meta.tag.code': 'test',
            'meta.profile': 'http://example.org/StructureDefinition/MyPatient'
          },
          offset: 0,
          count: 20,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

        await searchOperation.find(resourceType, searchParams)

        expect(mockFhirResourceModel.find).toHaveBeenCalledWith(mockQBInstance.condition)
        expect(mockFhirResourceModel.countDocuments).toHaveBeenCalledWith(mockQBInstance.condition)
      })

      it('should handle pagination parameters', async () => {
        const searchParams: SearchParameters = {
          _count: 50,
          _offset: 100
        }

        // Mock QueryBuilder with pagination
        const mockQBInstance = {
          condition: { resourceType: 'Patient' },
          offset: 100,
          count: 50,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

        await searchOperation.find(resourceType, searchParams)

        expect(mockFind.skip).toHaveBeenCalledWith(100)
        expect(mockSkip.limit).toHaveBeenCalledWith(50)
      })
    })

    describe('Error handling', () => {
      it('should propagate database errors from find', async () => {
        const searchParams: SearchParameters = {}

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({
          condition: {},
          offset: 0,
          count: 20,
          sort: {},
          projection: {}
        } as any))

        const databaseError = new Error('Database find failed')
        const mockSelect = {
          lean: jest.fn().mockRejectedValue(databaseError)
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        await expect(searchOperation.find(resourceType, searchParams))
          .rejects
          .toThrow('Database find failed')
      })

      it('should propagate database errors from countDocuments', async () => {
        const searchParams: SearchParameters = {}

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({
          condition: {},
          offset: 0,
          count: 20,
          sort: {},
          projection: {}
        } as any))

        // Mock successful find but failing count
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        const countError = new Error('Count operation failed')
        mockFhirResourceModel.countDocuments.mockRejectedValue(countError)

        await expect(searchOperation.find(resourceType, searchParams))
          .rejects
          .toThrow('Count operation failed')
      })
    })
  })

  describe('findByType', () => {
    describe('Successful search by types', () => {
      it('should search across multiple resource types', async () => {
        const resourceTypes = ['Patient', 'Observation', 'Encounter']
        const searchParams: SearchParameters = {
          _type: 'Patient,Observation,Encounter'
        }
        const mockResources = [
          { id: 'patient-1', resourceType: 'Patient' },
          { id: 'obs-1', resourceType: 'Observation' },
          { id: 'enc-1', resourceType: 'Encounter' }
        ]
        const mockBundle = {
          resourceType: 'Bundle',
          total: 3,
          entry: mockResources.map(resource => ({ resource }))
        }

        // Mock QueryBuilder
        const mockQBInstance = {
          condition: { resourceType: { $in: resourceTypes } },
          offset: 0,
          count: 20,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue(mockResources)
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(3)

        mockFhirResponse.bundle.mockReturnValue(mockBundle)

        const result = await searchOperation.findByType(resourceTypes, searchParams)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceTypes, searchParams)
        expect(searchParams._type).toBeUndefined() // Should be deleted
        expect(mockFhirResourceModel.find).toHaveBeenCalledWith(mockQBInstance.condition)
        expect(result).toEqual(mockBundle)
      })

      it('should handle single resource type array', async () => {
        const resourceTypes = ['Patient']
        const searchParams: SearchParameters = {
          identifier: 'system|value'
        }

        // Mock QueryBuilder
        const mockQBInstance = {
          condition: { resourceType: 'Patient', 'identifier.system': 'system' },
          offset: 0,
          count: 20,
          sort: { _id: 1 },
          projection: {}
        }
        mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

        await searchOperation.findByType(resourceTypes, searchParams)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceTypes, searchParams)
      })

      it('should remove _type parameter before processing', async () => {
        const resourceTypes = ['Patient', 'Observation']
        const searchParams: SearchParameters = {
          _type: 'Patient,Observation',
          identifier: 'test'
        }

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({
          condition: {},
          offset: 0,
          count: 20,
          sort: {},
          projection: {}
        } as any))

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

        await searchOperation.findByType(resourceTypes, searchParams)

        // Verify _type was deleted
        expect(searchParams._type).toBeUndefined()
        expect(searchParams.identifier).toBe('test') // Other params preserved
      })

      it('should handle empty resource types array', async () => {
        const resourceTypes: string[] = []
        const searchParams: SearchParameters = {}

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({
          condition: {},
          offset: 0,
          count: 20,
          sort: {},
          projection: {}
        } as any))

        // Mock database queries
        const mockSelect = {
          lean: jest.fn().mockResolvedValue([])
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)
        mockFhirResourceModel.countDocuments.mockResolvedValue(0)

        mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

        const result = await searchOperation.findByType(resourceTypes, searchParams)

        expect(mockQueryBuilder).toHaveBeenCalledWith(resourceTypes, searchParams)
        expect(result).toEqual({ resourceType: 'Bundle' })
      })
    })

    describe('Error handling', () => {
      it('should propagate database errors', async () => {
        const resourceTypes = ['Patient']
        const searchParams: SearchParameters = {}

        // Mock QueryBuilder
        mockQueryBuilder.mockImplementation(() => ({
          condition: {},
          offset: 0,
          count: 20,
          sort: {},
          projection: {}
        } as any))

        const databaseError = new Error('Database error in findByType')
        const mockSelect = {
          lean: jest.fn().mockRejectedValue(databaseError)
        }
        const mockSort = {
          select: jest.fn().mockReturnValue(mockSelect)
        }
        const mockLimit = {
          sort: jest.fn().mockReturnValue(mockSort)
        }
        const mockSkip = {
          limit: jest.fn().mockReturnValue(mockLimit)
        }
        const mockFind = {
          skip: jest.fn().mockReturnValue(mockSkip)
        }
        mockFhirResourceModel.find.mockReturnValue(mockFind as any)

        await expect(searchOperation.findByType(resourceTypes, searchParams))
          .rejects
          .toThrow('Database error in findByType')
      })
    })
  })

  describe('Method behavior validation', () => {
    it('should maintain async method signatures', () => {
      expect(typeof searchOperation.findById).toBe('function')
      expect(searchOperation.findById.constructor.name).toBe('AsyncFunction')
      expect(typeof searchOperation.find).toBe('function')
      expect(searchOperation.find.constructor.name).toBe('AsyncFunction')
      expect(typeof searchOperation.findByType).toBe('function')
      expect(searchOperation.findByType.constructor.name).toBe('AsyncFunction')
    })

    it('should return Promise from all async methods', () => {
      // Mock minimal setup to avoid errors
      mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))
      const mockSelect = {
        lean: jest.fn().mockResolvedValue(null)
      }
      const mockFindOne = {
        select: jest.fn().mockReturnValue(mockSelect)
      }
      mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)

      const findByIdPromise = searchOperation.findById('Patient', 'test').catch(() => {})
      expect(findByIdPromise).toBeInstanceOf(Promise)

      // Reset for find test
      mockQueryBuilder.mockImplementation(() => ({
        condition: {},
        offset: 0,
        count: 20,
        sort: {},
        projection: {}
      } as any))
      
      const mockSelectFind = {
        lean: jest.fn().mockResolvedValue([])
      }
      const mockSortFind = {
        select: jest.fn().mockReturnValue(mockSelectFind)
      }
      const mockLimitFind = {
        sort: jest.fn().mockReturnValue(mockSortFind)
      }
      const mockSkipFind = {
        limit: jest.fn().mockReturnValue(mockLimitFind)
      }
      const mockFindQuery = {
        skip: jest.fn().mockReturnValue(mockSkipFind)
      }
      mockFhirResourceModel.find.mockReturnValue(mockFindQuery as any)
      mockFhirResourceModel.countDocuments.mockResolvedValue(0)
      mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

      const findPromise = searchOperation.find('Patient', {})
      expect(findPromise).toBeInstanceOf(Promise)

      const findByTypePromise = searchOperation.findByType(['Patient'], {})
      expect(findByTypePromise).toBeInstanceOf(Promise)
    })
  })

  describe('Integration with dependencies', () => {
    it('should properly initialize QueryBuilder with correct parameters', async () => {
      const resourceType = 'Patient'
      const searchParams: SearchParameters = { _count: 10 }
      const resourceId = 'patient-123'

      // Mock QueryBuilder
      mockQueryBuilder.mockImplementation(() => ({ projection: {} } as any))

      // Mock database query for findById
      const mockSelect = {
        lean: jest.fn().mockResolvedValue({ id: resourceId })
      }
      const mockFindOne = {
        select: jest.fn().mockReturnValue(mockSelect)
      }
      mockFhirResourceModel.findOne.mockReturnValue(mockFindOne as any)
      mockFhirResponse.format.mockReturnValue({})

      await searchOperation.findById(resourceType, resourceId, searchParams)

      expect(mockQueryBuilder).toHaveBeenCalledWith(resourceType, searchParams, resourceId)
    })

    it('should pass correct parameters to FhirResponse methods', async () => {
      const resourceType = 'Patient'
      const searchParams: SearchParameters = {}

      // Mock QueryBuilder
      const mockQBInstance = {
        condition: { resourceType: 'Patient' },
        offset: 0,
        count: 20,
        sort: { _id: 1 },
        projection: {}
      }
      mockQueryBuilder.mockImplementation(() => mockQBInstance as any)

      const mockResources = [{ id: 'patient-1', resourceType: 'Patient' }]

      // Mock database queries
      const mockSelect = {
        lean: jest.fn().mockResolvedValue(mockResources)
      }
      const mockSort = {
        select: jest.fn().mockReturnValue(mockSelect)
      }
      const mockLimit = {
        sort: jest.fn().mockReturnValue(mockSort)
      }
      const mockSkip = {
        limit: jest.fn().mockReturnValue(mockLimit)
      }
      const mockFind = {
        skip: jest.fn().mockReturnValue(mockSkip)
      }
      mockFhirResourceModel.find.mockReturnValue(mockFind as any)
      mockFhirResourceModel.countDocuments.mockResolvedValue(1)

      mockFhirResponse.bundle.mockReturnValue({ resourceType: 'Bundle' })

      await searchOperation.find(resourceType, searchParams)

      expect(mockFhirResponse.bundle).toHaveBeenCalledWith(
        mockResources,
        1,
        mockQBInstance.offset,
        mockQBInstance.count,
        mockRequest
      )
    })
  })
})