/**
 * Represents an event that occurs when a FHIR resource is created, updated, or deleted.
 * Used for tracking changes and triggering subscriptions in the FHIR server.
 */
export interface ResourceChangeEvent {
  
  /**
   * The type of change that occurred to the resource
   * - 'create': A new resource was created
   * - 'update': An existing resource was modified
   * - 'delete': A resource was removed
   */
  eventType: 'create' | 'update' | 'delete';
  
  /**
   * The FHIR resource type that was changed (e.g., 'Patient', 'Observation')
   */
  resourceType: string;
  
  /**
   * The unique identifier of the affected resource
   */
  resourceId: string;
  
  /**
   * The current state of the resource after the change
   * Only present for 'create' and 'update' events
   */
  resource?: Record<string, unknown>;
  
  /**
   * The previous state of the resource before the change
   * Only present for 'update' and 'delete' events
   */
  previousResource?: Record<string, unknown>;
}
