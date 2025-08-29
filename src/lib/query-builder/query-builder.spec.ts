import { QueryBuilder } from './query-builder'
import { SearchParameters } from '../../interfaces/search-parameters'

describe('QueryBuilder', () => {
  
  describe('Constructor', () => {
    it('should initialize with a single resource', () => {
      const qb = new QueryBuilder('Patient')
      
      expect(qb.resources).toEqual(['Patient'])
      expect(qb.count).toBe(20)
      expect(qb.offset).toBe(0)
      expect(qb.condition.resourceType).toBe('Patient')
    })
    
    it('should initialize with multiple resources', () => {
      const qb = new QueryBuilder(['Patient', 'Observation'])
      
      expect(qb.resources).toEqual(['Patient', 'Observation'])
      expect(qb.condition.resourceType).toEqual({ $in: ['Patient', 'Observation'] })
    })
    
    it('should initialize with search parameters', () => {
      const searchParams: SearchParameters = {
        _count: 50,
        _offset: 10,
        _sort: 'name'
      }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.count).toBe(50)
      expect(qb.offset).toBe(10)
      expect(qb.sort.name).toBe(1)
    })
    
    it('should initialize with id parameter', () => {
      const qb = new QueryBuilder('Patient', {}, 'patient-123')
      
      expect(qb.id).toBe('patient-123')
    })
    
    it('should use _id from searchParams if no id parameter provided', () => {
      const searchParams: SearchParameters = { _id: 'patient-456' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.id).toBe('patient-456')
    })
    
    it('should prioritize id parameter over searchParams._id', () => {
      const searchParams: SearchParameters = { _id: 'patient-456' }
      const qb = new QueryBuilder('Patient', searchParams, 'patient-123')
      
      expect(qb.id).toBe('patient-123')
    })
  })
  
  describe('Summary Processing', () => {
    it('should handle _summary=text', () => {
      const searchParams: SearchParameters = { _summary: 'text' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toEqual({
        _id: 0,
        id: 1,
        resourceType: 1,
        meta: 1,
        text: 1,
        implicitRules: 1,
        language: 1
      })
    })
    
    it('should handle _summary=data', () => {
      const searchParams: SearchParameters = { _summary: 'data' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toEqual({
        _id: 0,
        text: 0
      })
    })
    
    it('should handle _summary=false', () => {
      const searchParams: SearchParameters = { _summary: 'false' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toEqual({
        _id: 0
      })
    })
    
    it('should not set projection for _summary=count', () => {
      const searchParams: SearchParameters = { _summary: 'count' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toBeUndefined()
    })
    
    it('should not set projection for _summary=true', () => {
      const searchParams: SearchParameters = { _summary: 'true' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toBeUndefined()
    })
  })
  
  describe('Elements Processing', () => {
    it('should handle _elements parameter', () => {
      const searchParams: SearchParameters = { _elements: 'id,name,gender' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toEqual({
        _id: 0,
        id: 1,
        name: 1,
        gender: 1,
        resourceType: 1
      })
    })
    
    it('should trim whitespace from elements', () => {
      const searchParams: SearchParameters = { _elements: ' id , name , gender ' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection).toEqual({
        _id: 0,
        id: 1,
        name: 1,
        gender: 1,
        resourceType: 1
      })
    })
    
    it('should include resourceType by default', () => {
      const searchParams: SearchParameters = { _elements: 'id,name' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.projection.resourceType).toBe(1)
    })
  })
  
  describe('Security Processing', () => {
    it('should handle _security parameter with system only', () => {
      const searchParams: SearchParameters = { _security: 'http://terminology.hl7.org/CodeSystem/v3-ActReason' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.security.system']).toBe('http://terminology.hl7.org/CodeSystem/v3-ActReason')
    })
    
    it('should handle _security parameter with system and code', () => {
      const searchParams: SearchParameters = { _security: 'http://terminology.hl7.org/CodeSystem/v3-ActReason|HTEST' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.security.system']).toBe('http://terminology.hl7.org/CodeSystem/v3-ActReason')
      expect(qb.condition['meta.security.value']).toBe('HTEST')
    })
  })
  
  describe('Tag Processing', () => {
    it('should handle single _tag parameter as string', () => {
      const searchParams: SearchParameters = { _tag: 'test' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.tag']).toEqual(['test'])
    })
    
    it('should handle multiple _tag parameters as comma-separated string', () => {
      const searchParams: SearchParameters = { _tag: 'test,production' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.tag']).toEqual(['test', 'production'])
    })
    
    it('should handle _tag parameter as array', () => {
      const searchParams: SearchParameters = { _tag: ['test', 'production'] } as any
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.tag']).toEqual(['test', 'production'])
    })
    
    it('should trim whitespace from tags', () => {
      const searchParams: SearchParameters = { _tag: ' test , production ' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.tag']).toEqual(['test', 'production'])
    })
  })
  
  describe('Identifier Processing', () => {
    it('should handle identifier with system only', () => {
      const searchParams: SearchParameters = { identifier: 'http://example.org/patient-ids' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['identifier.system']).toBe('http://example.org/patient-ids')
    })
    
    it('should handle identifier with system and value', () => {
      const searchParams: SearchParameters = { identifier: 'http://example.org/patient-ids|12345' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['identifier.system']).toBe('http://example.org/patient-ids')
      expect(qb.condition['identifier.value']).toBe('12345')
    })
    
    it('should handle array of identifiers', () => {
      const searchParams: SearchParameters = {
        identifier: ['http://example.org/patient-ids|12345', 'http://example.org/mrn|67890'] as any
      }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['identifier.system']).toBe('http://example.org/mrn')
      expect(qb.condition['identifier.value']).toBe('67890')
    })
  })
  
  describe('Profile Processing', () => {
    it('should handle _profile parameter', () => {
      const searchParams: SearchParameters = { _profile: 'http://hl7.org/fhir/StructureDefinition/Patient' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['meta.profile']).toBe('http://hl7.org/fhir/StructureDefinition/Patient')
    })
  })
  
  describe('Sort Processing', () => {
    it('should have empty sort when no parameters provided', () => {
      const qb = new QueryBuilder('Patient')
      
      expect(Object.keys(qb.sort)).toHaveLength(0)
    })
    
    it('should handle single ascending sort', () => {
      const searchParams: SearchParameters = { _sort: 'name' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.sort.name).toBe(1)
    })
    
    it('should handle single descending sort', () => {
      const searchParams: SearchParameters = { _sort: '-name' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.sort.name).toBe(-1)
    })
    
    it('should handle multiple sort fields', () => {
      const searchParams: SearchParameters = { _sort: 'name,-birthDate,gender' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.sort.name).toBe(1)
      expect(qb.sort.birthDate).toBe(-1)
      expect(qb.sort.gender).toBe(1)
    })
    
    it('should trim whitespace from sort fields', () => {
      const searchParams: SearchParameters = { _sort: ' name , -birthDate , gender ' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.sort.name).toBe(1)
      expect(qb.sort.birthDate).toBe(-1)
      expect(qb.sort.gender).toBe(1)
    })
  })
  
  describe('Text Search Processing', () => {
    it('should handle exact phrase search', () => {
      const searchParams: SearchParameters = { _text: '"diabetes mellitus"' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: '"diabetes mellitus"',
        $caseSensitive: false
      })
      expect(qb.condition['text.div']).toEqual({ $exists: true })
    })
    
    it('should handle boolean AND search', () => {
      const searchParams: SearchParameters = { _text: 'diabetes AND medication' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: 'diabetes medication',
        $caseSensitive: false
      })
    })
    
    it('should handle boolean OR search', () => {
      const searchParams: SearchParameters = { _text: 'diabetes OR medication' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: 'diabetes | medication',
        $caseSensitive: false
      })
    })
    
    it('should handle negative search', () => {
      const searchParams: SearchParameters = { _text: '-cancer' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: '-cancer',
        $caseSensitive: false
      })
    })
    
    it('should handle simple term search', () => {
      const searchParams: SearchParameters = { _text: 'diabetes' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: 'diabetes',
        $caseSensitive: false
      })
    })
    
    it('should trim whitespace from search term', () => {
      const searchParams: SearchParameters = { _text: '  diabetes  ' }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.condition['$text']).toEqual({
        $search: 'diabetes',
        $caseSensitive: false
      })
    })
  })
  
  describe('Transform Method', () => {
    it('should flatten nested objects to dot notation', () => {
      const qb = new QueryBuilder('Patient')
      const nested = {
        name: {
          family: 'Smith',
          given: 'John'
        },
        address: {
          city: 'Boston',
          state: 'MA'
        }
      }
      
      const result = (qb as any).transform(nested)
      
      expect(result).toEqual({
        'name.family': 'Smith',
        'name.given': 'John',
        'address.city': 'Boston',
        'address.state': 'MA'
      })
    })
    
    it('should preserve MongoDB operators', () => {
      const qb = new QueryBuilder('Patient')
      const queryWithOperators = {
        age: { $gte: 18, $lt: 65 },
        status: { $in: ['active', 'inactive'] },
        $or: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      }
      
      const result = (qb as any).transform(queryWithOperators)
      
      expect(result).toEqual({
        age: { $gte: 18, $lt: 65 },
        status: { $in: ['active', 'inactive'] },
        $or: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      })
    })
    
    it('should handle objects that contain only MongoDB operators', () => {
      const qb = new QueryBuilder('Patient')
      const operatorOnlyObject = {
        field: { $exists: true, $ne: null }
      }
      
      const result = (qb as any).transform(operatorOnlyObject)
      
      expect(result).toEqual({
        field: { $exists: true, $ne: null }
      })
    })
    
    it('should handle arrays correctly', () => {
      const qb = new QueryBuilder('Patient')
      const queryWithArrays = {
        tags: ['tag1', 'tag2'],
        nested: {
          items: [1, 2, 3]
        }
      }
      
      const result = (qb as any).transform(queryWithArrays)
      
      expect(result).toEqual({
        tags: ['tag1', 'tag2'],
        'nested.items': [1, 2, 3]
      })
    })
  })
  
  describe('Parameter Filtering with ID', () => {
    it('should filter out non-allowed parameters when ID is present', () => {
      const searchParams: SearchParameters = {
        _id: 'patient-123',
        identifier: 'some-identifier',
        _count: 10,
        _sort: 'name'
      }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.searchParams).not.toHaveProperty('identifier')
      expect(qb.searchParams).toHaveProperty('_count')
      expect(qb.searchParams).toHaveProperty('_sort')
    })
    
    it('should not filter parameters when ID is not present', () => {
      const searchParams: SearchParameters = {
        identifier: 'some-identifier',
        _count: 10,
        _sort: 'name'
      }
      const qb = new QueryBuilder('Patient', searchParams)
      
      expect(qb.searchParams).toHaveProperty('identifier')
      expect(qb.searchParams).toHaveProperty('_count')
      expect(qb.searchParams).toHaveProperty('_sort')
    })
  })
  
  describe('Getters', () => {
    it('should return correct values from getters', () => {
      const searchParams: SearchParameters = {
        _count: 30,
        _offset: 15,
        _sort: 'name'
      }
      const qb = new QueryBuilder(['Patient', 'Observation'], searchParams)
      
      expect(qb.resources).toEqual(['Patient', 'Observation'])
      expect(qb.count).toBe(30)
      expect(qb.offset).toBe(15)
      expect(qb.id).toBeUndefined()
      expect(qb.searchParams).toBe(searchParams)
      expect(qb.sort.name).toBe(1)
    })
    
    it('should return correct values when ID is present', () => {
      const searchParams: SearchParameters = {
        _count: 30,
        _sort: 'name'
      }
      const qb = new QueryBuilder('Patient', searchParams, 'test-id')
      
      expect(qb.resources).toEqual(['Patient'])
      expect(qb.count).toBe(30)
      expect(qb.id).toBe('test-id')
      expect(qb.sort.name).toBe(1)
    })
    
    it('should return transformed condition with default sort', () => {
      const qb = new QueryBuilder('Patient')
      const condition = qb.condition
      
      expect(condition).toHaveProperty('resourceType')
      expect(condition.resourceType).toBe('Patient')
    })
    
    it('should return transformed condition with custom sort', () => {
      const searchParams: SearchParameters = { _sort: 'name' }
      const qb = new QueryBuilder('Patient', searchParams)
      const condition = qb.condition
      
      expect(condition).toHaveProperty('resourceType')
      expect(condition.resourceType).toBe('Patient')
    })
    
    it('should have empty sort object when no sort parameter provided', () => {
      const qb = new QueryBuilder('Patient')
      
      expect(Object.keys(qb.sort)).toHaveLength(0)
      expect(Object.getOwnPropertyNames(qb.sort)).toHaveLength(0)
    })
  })
})