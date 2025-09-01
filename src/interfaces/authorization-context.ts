/**
 * Interface representing the authorization context for FHIR requests.
 * Contains information about user permissions and access scopes.
 */
export interface AuthorizationContext {
    scopes: string[];
    userId?: string;
    patientId?: string; // For patient context
    roles?: string[];
}