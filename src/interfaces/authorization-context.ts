export interface AuthorizationContext {
    scopes: string[];
    userId?: string;
    patientId?: string; // For patient context
    roles?: string[];
}