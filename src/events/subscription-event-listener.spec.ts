import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionEventListener, ResourceEvent } from './subscription-event-listener';

describe('SubscriptionEventListener', () => {
  let listener: SubscriptionEventListener;

  // Mock console.log to capture and verify output
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionEventListener]
    }).compile();

    listener = module.get<SubscriptionEventListener>(SubscriptionEventListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(listener).toBeDefined();
    });

    it('should be an instance of SubscriptionEventListener', () => {
      expect(listener).toBeInstanceOf(SubscriptionEventListener);
    });
  });

  describe('ResourceEvent Enum', () => {
    it('should define correct event constants', () => {
      expect(ResourceEvent.CREATED).toBe('resource.created');
      expect(ResourceEvent.UPDATED).toBe('resource.updated');
      expect(ResourceEvent.DELETED).toBe('resource.deleted');
    });

    it('should have all required event types', () => {
      const eventValues = Object.values(ResourceEvent);
      expect(eventValues).toHaveLength(3);
      expect(eventValues).toContain('resource.created');
      expect(eventValues).toContain('resource.updated');
      expect(eventValues).toContain('resource.deleted');
    });
  });

  describe('handleResourceCreatedEvent', () => {
    it('should handle resource created event', () => {
      const payload = ResourceEvent.CREATED;

      listener.handleResourceCreatedEvent(payload);

      expect(mockConsoleLog).toHaveBeenCalledWith(payload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should handle resource created event with different payload types', () => {
      const testPayloads = [
        ResourceEvent.CREATED,
        'custom-event-data',
        { resourceType: 'Patient', id: 'patient-123', event: 'created' },
        null,
        undefined
      ];

      testPayloads.forEach((payload, index) => {
        listener.handleResourceCreatedEvent(payload as ResourceEvent);
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, payload);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(testPayloads.length);
    });

    it('should handle multiple consecutive created events', () => {
      const events = [
        ResourceEvent.CREATED,
        ResourceEvent.CREATED,
        ResourceEvent.CREATED
      ];

      events.forEach(event => {
        listener.handleResourceCreatedEvent(event);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      events.forEach((event, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, event);
      });
    });

    it('should handle created event with complex resource data', () => {
      const complexPayload = {
        eventType: ResourceEvent.CREATED,
        resource: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: {
            versionId: '1',
            lastUpdated: '2023-08-27T10:00:00Z',
            profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
          },
          name: [{ family: 'Doe', given: ['John'] }],
          gender: 'male',
          birthDate: '1990-01-01'
        },
        timestamp: '2023-08-27T10:00:00Z',
        source: 'fhir-server'
      };

      listener.handleResourceCreatedEvent(complexPayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(complexPayload);
    });
  });

  describe('handleResourceUpdatedEvent', () => {
    it('should handle resource updated event', () => {
      const payload = ResourceEvent.UPDATED;

      listener.handleResourceUpdatedEvent(payload);

      expect(mockConsoleLog).toHaveBeenCalledWith(payload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should handle updated event with resource data', () => {
      const updatePayload = {
        eventType: ResourceEvent.UPDATED,
        resource: {
          resourceType: 'Patient',
          id: 'patient-123',
          meta: {
            versionId: '2'
          },
          name: [{ family: 'Updated', given: ['John'] }]
        },
        previousVersion: {
          versionId: '1'
        }
      };

      listener.handleResourceUpdatedEvent(updatePayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(updatePayload);
    });

    it('should handle multiple update events in sequence', () => {
      const updateEvents = [
        { id: 'patient-1', version: '2' },
        { id: 'patient-2', version: '1' },
        { id: 'patient-3', version: '5' }
      ];

      updateEvents.forEach(event => {
        listener.handleResourceUpdatedEvent(event as any);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      updateEvents.forEach((event, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, event);
      });
    });

    it('should handle updated event with different resource types', () => {
      const resourceTypes = ['Patient', 'Observation', 'Practitioner', 'Organization'];

      resourceTypes.forEach(resourceType => {
        const payload = {
          eventType: ResourceEvent.UPDATED,
          resource: { resourceType, id: `${resourceType.toLowerCase()}-123` }
        };

        listener.handleResourceUpdatedEvent(payload as any);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(resourceTypes.length);
    });

    it('should handle edge cases for updated events', () => {
      const edgeCases = [
        null,
        undefined,
        '',
        0,
        false,
        {},
        []
      ];

      edgeCases.forEach((payload, index) => {
        listener.handleResourceUpdatedEvent(payload as any);
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, payload);
      });
    });
  });

  describe('handleResourcDeletedEvent', () => {
    it('should handle resource deleted event', () => {
      const payload = ResourceEvent.DELETED;

      listener.handleResourcDeletedEvent(payload);

      expect(mockConsoleLog).toHaveBeenCalledWith(payload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should handle deleted event with resource information', () => {
      const deletePayload = {
        eventType: ResourceEvent.DELETED,
        resource: {
          resourceType: 'Patient',
          id: 'patient-123'
        },
        deletedBy: 'user-456',
        deletionReason: 'Patient requested data removal',
        timestamp: '2023-08-27T10:00:00Z'
      };

      listener.handleResourcDeletedEvent(deletePayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(deletePayload);
    });

    it('should handle cascading deletion events', () => {
      const cascadingDeletes = [
        { resourceType: 'Patient', id: 'patient-123' },
        { resourceType: 'Observation', id: 'obs-456', relatedPatient: 'patient-123' },
        { resourceType: 'Encounter', id: 'enc-789', relatedPatient: 'patient-123' }
      ];

      cascadingDeletes.forEach(deleteEvent => {
        listener.handleResourcDeletedEvent(deleteEvent as any);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      cascadingDeletes.forEach((event, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, event);
      });
    });

    it('should handle soft deletion vs hard deletion events', () => {
      const softDelete = {
        eventType: ResourceEvent.DELETED,
        deletionType: 'soft',
        resource: { resourceType: 'Patient', id: 'patient-123' },
        status: 'inactive'
      };

      const hardDelete = {
        eventType: ResourceEvent.DELETED,
        deletionType: 'hard',
        resource: { resourceType: 'Patient', id: 'patient-456' },
        status: 'removed'
      };

      listener.handleResourcDeletedEvent(softDelete as any);
      listener.handleResourcDeletedEvent(hardDelete as any);

      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, softDelete);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, hardDelete);
    });

    it('should handle bulk deletion events', () => {
      const bulkDeletePayload = {
        eventType: ResourceEvent.DELETED,
        operation: 'bulk-delete',
        deletedResources: [
          { resourceType: 'Patient', id: 'patient-1' },
          { resourceType: 'Patient', id: 'patient-2' },
          { resourceType: 'Patient', id: 'patient-3' }
        ],
        totalDeleted: 3,
        criteria: 'status=inactive AND lastModified<2023-01-01'
      };

      listener.handleResourcDeletedEvent(bulkDeletePayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(bulkDeletePayload);
    });
  });

  describe('Event Handler Method Names and Signatures', () => {
    it('should have correctly named event handler methods', () => {
      expect(typeof listener.handleResourceCreatedEvent).toBe('function');
      expect(typeof listener.handleResourceUpdatedEvent).toBe('function');
      expect(typeof listener.handleResourcDeletedEvent).toBe('function');
    });

    it('should have the typo in handleResourcDeletedEvent method name', () => {
      // This test documents the existing typo - should be "Resource" not "Resourc"
      expect(listener.handleResourcDeletedEvent).toBeDefined();
      expect(typeof listener.handleResourcDeletedEvent).toBe('function');
    });

    it('should accept any parameter type for event handlers', () => {
      // Since the current implementation uses ResourceEvent enum as parameter type
      // but actually receives event data, these should not throw
      expect(() => listener.handleResourceCreatedEvent('test' as any)).not.toThrow();
      expect(() => listener.handleResourceUpdatedEvent({ data: 'test' } as any)).not.toThrow();
      expect(() => listener.handleResourcDeletedEvent(123 as any)).not.toThrow();
    });
  });

  describe('Event Processing Performance', () => {
    it('should handle high-frequency created events', () => {
      const startTime = Date.now();
      const eventCount = 1000;

      for (let i = 0; i < eventCount; i++) {
        listener.handleResourceCreatedEvent(ResourceEvent.CREATED);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(mockConsoleLog).toHaveBeenCalledTimes(eventCount);
      expect(processingTime).toBeLessThan(1000); // Should process 1000 events in less than 1 second
    });

    it('should handle mixed event types rapidly', () => {
      const events = [
        { handler: 'handleResourceCreatedEvent', payload: ResourceEvent.CREATED },
        { handler: 'handleResourceUpdatedEvent', payload: ResourceEvent.UPDATED },
        { handler: 'handleResourcDeletedEvent', payload: ResourceEvent.DELETED }
      ];

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        events.forEach(event => {
          (listener as any)[event.handler](event.payload);
        });
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(mockConsoleLog).toHaveBeenCalledTimes(iterations * events.length);
      expect(processingTime).toBeLessThan(500);
    });

    it('should handle large payloads efficiently', () => {
      const largePayload = {
        eventType: ResourceEvent.CREATED,
        resource: {
          resourceType: 'Bundle',
          entry: new Array(1000).fill(null).map((_, index) => ({
            resource: {
              resourceType: 'Patient',
              id: `patient-${index}`,
              name: [{ family: `Family${index}`, given: [`Given${index}`] }]
            }
          }))
        }
      };

      const startTime = Date.now();
      listener.handleResourceCreatedEvent(largePayload as any);
      const endTime = Date.now();

      expect(mockConsoleLog).toHaveBeenCalledWith(largePayload);
      expect(endTime - startTime).toBeLessThan(100); // Should handle large payload quickly
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle null and undefined payloads without errors', () => {
      expect(() => listener.handleResourceCreatedEvent(null as any)).not.toThrow();
      expect(() => listener.handleResourceUpdatedEvent(undefined as any)).not.toThrow();
      expect(() => listener.handleResourcDeletedEvent(null as any)).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, null);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, undefined);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, null);
    });

    it('should handle circular references in payloads', () => {
      const circularPayload: any = {
        eventType: ResourceEvent.CREATED,
        resource: { resourceType: 'Patient', id: 'patient-123' }
      };
      circularPayload.self = circularPayload;

      expect(() => listener.handleResourceCreatedEvent(circularPayload)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(circularPayload);
    });

    it('should handle very deep nested objects', () => {
      const deepObject: any = { eventType: ResourceEvent.UPDATED };
      let current = deepObject;

      // Create 100 levels of nesting
      for (let i = 0; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      expect(() => listener.handleResourceUpdatedEvent(deepObject)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(deepObject);
    });

    it('should handle payloads with special characters and encoding', () => {
      const specialPayload = {
        eventType: ResourceEvent.DELETED,
        resource: {
          resourceType: 'Patient',
          name: 'João ñ 中文 🎉 "\' <script>',
          specialChars: '!@#$%^&*()[]{}|;:,.<>?',
          unicode: '\u0000\u001F\u007F\u009F',
          emoji: '🔥💯✨🚀'
        }
      };

      expect(() => listener.handleResourcDeletedEvent(specialPayload as any)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(specialPayload);
    });

    it('should handle arrays as payloads', () => {
      const arrayPayload = [
        { eventType: ResourceEvent.CREATED, resource: { id: '1' } },
        { eventType: ResourceEvent.UPDATED, resource: { id: '2' } },
        { eventType: ResourceEvent.DELETED, resource: { id: '3' } }
      ];

      expect(() => listener.handleResourceCreatedEvent(arrayPayload as any)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(arrayPayload);
    });

    it('should handle function payloads', () => {
      const functionPayload = (): string => ResourceEvent.CREATED;

      expect(() => listener.handleResourceCreatedEvent(functionPayload as any)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(functionPayload);
    });
  });

  describe('Integration with Event System', () => {
    it('should simulate realistic FHIR resource lifecycle events', async () => {
      // Simulate a complete patient lifecycle
      const patientId = 'patient-lifecycle-test';

      // 1. Patient created
      const createEvent = {
        eventType: ResourceEvent.CREATED,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          meta: { versionId: '1' },
          name: [{ family: 'Test', given: ['Integration'] }],
          gender: 'male'
        },
        timestamp: new Date().toISOString()
      };

      listener.handleResourceCreatedEvent(createEvent as any);

      // 2. Patient updated multiple times
      const updateEvents = [
        {
          eventType: ResourceEvent.UPDATED,
          resource: { ...createEvent.resource, meta: { versionId: '2' }, birthDate: '1990-01-01' }
        },
        {
          eventType: ResourceEvent.UPDATED,
          resource: { ...createEvent.resource, meta: { versionId: '3' }, telecom: [{ system: 'phone', value: '123-456-7890' }] }
        }
      ];

      updateEvents.forEach(event => {
        listener.handleResourceUpdatedEvent(event as any);
      });

      // 3. Patient deleted
      const deleteEvent = {
        eventType: ResourceEvent.DELETED,
        resource: { resourceType: 'Patient', id: patientId },
        deletionReason: 'Integration test cleanup',
        timestamp: new Date().toISOString()
      };

      listener.handleResourcDeletedEvent(deleteEvent as any);

      // Verify all events were processed
      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, createEvent);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, updateEvents[0]);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, updateEvents[1]);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(4, deleteEvent);
    });

    it('should handle concurrent events from multiple resources', () => {
      const resourceTypes = ['Patient', 'Observation', 'Practitioner', 'Organization'];
      const events: any[] = [];

      // Generate concurrent events for multiple resources
      resourceTypes.forEach((resourceType, index) => {
        const createEvent = {
          eventType: ResourceEvent.CREATED,
          resource: { resourceType, id: `${resourceType.toLowerCase()}-${index}` }
        };

        const updateEvent = {
          eventType: ResourceEvent.UPDATED,
          resource: { resourceType, id: `${resourceType.toLowerCase()}-${index}`, version: '2' }
        };

        events.push(createEvent, updateEvent);
      });

      // Process all events
      events.forEach(event => {
        if (event.eventType === ResourceEvent.CREATED) {
          listener.handleResourceCreatedEvent(event);
        } else if (event.eventType === ResourceEvent.UPDATED) {
          listener.handleResourceUpdatedEvent(event);
        }
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(events.length);
    });
  });

  describe('Console Output Verification', () => {
    it('should log exact payload for created events', () => {
      const testPayload = { test: 'created-payload', number: 42, nested: { key: 'value' } };

      listener.handleResourceCreatedEvent(testPayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(testPayload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should log exact payload for updated events', () => {
      const testPayload = { test: 'updated-payload', array: [1, 2, 3], boolean: true };

      listener.handleResourceUpdatedEvent(testPayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(testPayload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should log exact payload for deleted events', () => {
      const testPayload = { test: 'deleted-payload', date: new Date().toISOString() };

      listener.handleResourcDeletedEvent(testPayload as any);

      expect(mockConsoleLog).toHaveBeenCalledWith(testPayload);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should maintain payload integrity across multiple calls', () => {
      const payloads = [
        { id: 1, data: 'first' },
        { id: 2, data: 'second' },
        { id: 3, data: 'third' }
      ];

      payloads.forEach(payload => {
        listener.handleResourceCreatedEvent(payload as any);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      payloads.forEach((payload, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, payload);
      });
    });
  });
});