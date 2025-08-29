import {ProvenanceBuilder} from './provenance-builder'
import {EventPayload} from '../../interfaces/event-payload'

describe('ProvenanceBuilder', () => {
  let provenanceBuilder: ProvenanceBuilder
  let mockModel: jest.MockedFunction<any>
  let mockResource: any

  beforeEach(() => {
    mockResource = {
      id: undefined,
      resourceType: undefined,
      recorded: undefined,
      reason: undefined,
      agent: undefined,
      target: undefined,
      activity: undefined,
      save: jest.fn().mockResolvedValue(true)
    }

    // Create a mock constructor function
    mockModel = jest.fn().mockImplementation(() => mockResource)
    
    provenanceBuilder = new ProvenanceBuilder(mockModel as any)
  })

  describe('Constructor', () => {
    it('should create an instance with the provided model', () => {
      expect(provenanceBuilder).toBeInstanceOf(ProvenanceBuilder)
    })
  })

  describe('register', () => {
    let mockPayload: EventPayload

    beforeEach(() => {
      mockPayload = {
        resourceType: 'Patient' as any,
        id: 'patient-123' as any,
        request: {} as any
      }

      // Reset the mock before each test
      mockModel.mockClear()
    })

    it('should create and save a provenance resource for read activity', () => {
      provenanceBuilder.register(mockPayload, 'read')

      expect(mockModel).toHaveBeenCalledWith({
        id: expect.any(String),
        resourceType: 'Provenance',
        recorded: expect.any(Date)
      })

      expect(mockResource.reason).toEqual([{
        system: "http://terminology.hl7.org/ValueSet/v3-PurposeOfUse",
        code: "PATADMIN",
        display: "Patient Administration"
      }])

      expect(mockResource.agent).toEqual([{
        role: [{
          coding: [{
            system: "https://profiles.ihe.net/ITI/BALP/CodeSystem/UserAgentTypes",
            code: "UserOauthAgent",
            display: "User OAuth Agent participant"
          }]
        }],
        whoReference: {
          display: "Unkown systen"
        }
      }])

      expect(mockResource.target).toEqual([{
        reference: 'Patient/patient-123'
      }])

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "READ",
          display: "read"
        }]
      })

      expect(mockResource.save).toHaveBeenCalled()
    })

    it('should create provenance resource for create activity', () => {
      provenanceBuilder.register(mockPayload, 'create')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "CREATE",
          display: "create"
        }]
      })
    })

    it('should create provenance resource for update activity', () => {
      provenanceBuilder.register(mockPayload, 'update')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "UPDATE",
          display: "update"
        }]
      })
    })

    it('should create provenance resource for delete activity', () => {
      provenanceBuilder.register(mockPayload, 'delete')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "DELETE",
          display: "delete"
        }]
      })
    })

    it('should create provenance resource for execute activity', () => {
      provenanceBuilder.register(mockPayload, 'execute')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "EXECUTE",
          display: "execute"
        }]
      })
    })

    it('should handle unknown activity by not setting activity field', () => {
      provenanceBuilder.register(mockPayload, 'unknown')

      expect(mockResource.activity).toBeUndefined()
    })

    it('should handle payload without ID', () => {
      const payloadWithoutId = {
        resourceType: 'Patient' as any,
        request: {} as any
      }

      provenanceBuilder.register(payloadWithoutId, 'read')

      expect(mockResource.target).toEqual([{
        reference: 'Patient'
      }])
    })

    it('should handle payload with empty string ID', () => {
      const payloadWithEmptyId = {
        resourceType: 'Patient' as any,
        id: '' as any,
        request: {} as any
      }

      provenanceBuilder.register(payloadWithEmptyId, 'read')

      expect(mockResource.target).toEqual([{
        reference: 'Patient'
      }])
    })

    it('should generate unique UUIDs for each provenance resource', () => {
      const payload1 = { ...mockPayload }
      const payload2 = { ...mockPayload }

      const resource1 = { ...mockResource, save: jest.fn() }
      const resource2 = { ...mockResource, save: jest.fn() }

      mockModel
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2)

      provenanceBuilder.register(payload1, 'read')
      provenanceBuilder.register(payload2, 'read')

      const calls = mockModel.mock.calls
      expect(calls[0][0].id).not.toBe(calls[1][0].id)
      expect(calls[0][0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      expect(calls[1][0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('should set recorded timestamp to current time', () => {
      const beforeTime = new Date()
      
      provenanceBuilder.register(mockPayload, 'read')
      
      const afterTime = new Date()
      const recordedTime = mockModel.mock.calls[0][0].recorded

      expect(recordedTime).toBeInstanceOf(Date)
      expect(recordedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(recordedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })

  describe('addReason (private method)', () => {
    it('should add standardized reason for patient administration', () => {
      const mockResource = {}
      
      provenanceBuilder['addReason'](mockResource)

      expect(mockResource).toEqual({
        reason: [{
          system: "http://terminology.hl7.org/ValueSet/v3-PurposeOfUse",
          code: "PATADMIN",
          display: "Patient Administration"
        }]
      })
    })

    it('should overwrite existing reason', () => {
      const mockResource = {
        reason: [{ system: "old", code: "OLD", display: "Old reason" }]
      }

      provenanceBuilder['addReason'](mockResource)

      expect(mockResource.reason).toEqual([{
        system: "http://terminology.hl7.org/ValueSet/v3-PurposeOfUse",
        code: "PATADMIN",
        display: "Patient Administration"
      }])
    })
  })

  describe('addAgent (private method)', () => {
    it('should add agent with OAuth user agent role', () => {
      const mockResource = {}

      provenanceBuilder['addAgent'](mockResource)

      expect(mockResource).toEqual({
        agent: [{
          role: [{
            coding: [{
              system: "https://profiles.ihe.net/ITI/BALP/CodeSystem/UserAgentTypes",
              code: "UserOauthAgent",
              display: "User OAuth Agent participant"
            }]
          }],
          whoReference: {
            display: "Unkown systen"
          }
        }]
      })
    })

    it('should overwrite existing agent', () => {
      const mockResource = {
        agent: [{ role: [], whoReference: { display: "old" } }]
      }

      provenanceBuilder['addAgent'](mockResource)

      expect(mockResource.agent).toEqual([{
        role: [{
          coding: [{
            system: "https://profiles.ihe.net/ITI/BALP/CodeSystem/UserAgentTypes",
            code: "UserOauthAgent",
            display: "User OAuth Agent participant"
          }]
        }],
        whoReference: {
          display: "Unkown systen"
        }
      }])
    })

    it('should contain typo in whoReference display', () => {
      const mockResource = {}

      provenanceBuilder['addAgent'](mockResource)

      // Test that the typo exists (this is documenting current behavior)
      expect(mockResource['agent'][0].whoReference.display).toBe("Unkown systen")
    })
  })

  describe('addTarget (private method)', () => {
    it('should add target reference with resource type and ID', () => {
      const mockResource = {}
      const payload = { resourceType: 'Patient' as any, id: 'patient-123' as any }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Patient/patient-123'
        }]
      })
    })

    it('should add target reference with only resource type when no ID', () => {
      const mockResource = {}
      const payload = { resourceType: 'Patient' as any }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Patient'
        }]
      })
    })

    it('should add target reference with only resource type when ID is null', () => {
      const mockResource = {}
      const payload = { resourceType: 'Patient' as any, id: null }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Patient'
        }]
      })
    })

    it('should add target reference with only resource type when ID is undefined', () => {
      const mockResource = {}
      const payload = { resourceType: 'Patient' as any, id: undefined }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Patient'
        }]
      })
    })

    it('should add target reference with only resource type when ID is empty string', () => {
      const mockResource = {}
      const payload = { resourceType: 'Patient' as any, id: '' as any }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Patient'
        }]
      })
    })

    it('should handle different resource types', () => {
      const mockResource = {}
      const payload = { resourceType: 'Observation' as any, id: 'obs-456' as any }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource).toEqual({
        target: [{
          reference: 'Observation/obs-456'
        }]
      })
    })

    it('should overwrite existing target', () => {
      const mockResource = {
        target: [{ reference: 'OldResource/old-123' }]
      }
      const payload = { resourceType: 'Patient' as any, id: 'patient-123' as any }

      provenanceBuilder['addTarget'](mockResource, payload)

      expect(mockResource.target).toEqual([{
        reference: 'Patient/patient-123'
      }])
    })
  })

  describe('addActivity (private method)', () => {
    let mockResource: any

    beforeEach(() => {
      mockResource = {}
    })

    it('should add READ activity for read operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'read')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "READ",
          display: "read"
        }]
      })
    })

    it('should add CREATE activity for create operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'create')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "CREATE",
          display: "create"
        }]
      })
    })

    it('should add UPDATE activity for update operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'update')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "UPDATE",
          display: "update"
        }]
      })
    })

    it('should add DELETE activity for delete operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'delete')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "DELETE",
          display: "delete"
        }]
      })
    })

    it('should add EXECUTE activity for execute operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'execute')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "EXECUTE",
          display: "execute"
        }]
      })
    })

    it('should not set activity for unknown operation', () => {
      provenanceBuilder['addActivity'](mockResource, 'unknown')

      expect(mockResource.activity).toBeUndefined()
    })

    it('should not set activity for empty string operation', () => {
      provenanceBuilder['addActivity'](mockResource, '')

      expect(mockResource.activity).toBeUndefined()
    })

    it('should not set activity for null operation', () => {
      provenanceBuilder['addActivity'](mockResource, null as any)

      expect(mockResource.activity).toBeUndefined()
    })

    it('should handle case sensitivity', () => {
      provenanceBuilder['addActivity'](mockResource, 'READ')

      expect(mockResource.activity).toBeUndefined()
    })

    it('should handle case sensitivity for create', () => {
      provenanceBuilder['addActivity'](mockResource, 'CREATE')

      expect(mockResource.activity).toBeUndefined()
    })

    it('should overwrite existing activity', () => {
      mockResource.activity = {
        coding: [{ system: "old", code: "OLD", display: "old" }]
      }

      provenanceBuilder['addActivity'](mockResource, 'read')

      expect(mockResource.activity).toEqual({
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "READ",
          display: "read"
        }]
      })
    })

    it('should use consistent coding system for all activities', () => {
      const activities = ['read', 'create', 'update', 'delete', 'execute']
      
      activities.forEach(activity => {
        const resource = {}
        provenanceBuilder['addActivity'](resource, activity)
        
        expect(resource['activity'].coding[0].system).toBe(
          "http://terminology.hl7.org/CodeSystem/v3-DataOperation"
        )
      })
    })

    it('should use uppercase codes for all activities', () => {
      const activityMappings = {
        'read': 'READ',
        'create': 'CREATE',
        'update': 'UPDATE',
        'delete': 'DELETE',
        'execute': 'EXECUTE'
      }

      Object.entries(activityMappings).forEach(([activity, expectedCode]) => {
        const resource = {}
        provenanceBuilder['addActivity'](resource, activity)
        
        expect(resource['activity'].coding[0].code).toBe(expectedCode)
      })
    })

    it('should use lowercase displays for all activities', () => {
      const activities = ['read', 'create', 'update', 'delete', 'execute']
      
      activities.forEach(activity => {
        const resource = {}
        provenanceBuilder['addActivity'](resource, activity)
        
        expect(resource['activity'].coding[0].display).toBe(activity)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should create complete provenance resource with all fields', () => {
      const payload = {
        resourceType: 'Patient' as any,
        id: 'patient-123' as any,
        request: {} as any
      }

      provenanceBuilder.register(payload, 'read')

      // Verify model constructor was called with correct initial data
      expect(mockModel).toHaveBeenCalledWith({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
        resourceType: 'Provenance',
        recorded: expect.any(Date)
      })

      // Verify all fields were set correctly
      expect(mockResource.reason).toBeDefined()
      expect(mockResource.agent).toBeDefined()
      expect(mockResource.target).toBeDefined()
      expect(mockResource.activity).toBeDefined()
      
      // Verify save was called
      expect(mockResource.save).toHaveBeenCalled()
    })

    it('should call save method without awaiting', () => {
      const payload = {
        resourceType: 'Patient' as any,
        id: 'patient-123' as any,
        request: {} as any
      }

      // Mock save to return a promise (as Mongoose save does)
      mockResource.save = jest.fn().mockReturnValue(Promise.resolve())

      // This should not throw even if save would fail
      expect(() => provenanceBuilder.register(payload, 'read')).not.toThrow()
      
      // Verify save was called (fire and forget)
      expect(mockResource.save).toHaveBeenCalled()
    })
  })
})