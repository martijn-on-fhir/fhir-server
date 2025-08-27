/**
 * Represents a validation error encountered during FHIR resource validation
 */
export interface ValidationError {
  /** JSON path where the validation error occurred */
  path: string;
  /** Severity level of the validation issue */
  severity: 'error' | 'warning';
  /** Human-readable description of the validation error */
  message: string;
  /** Optional constraint that was violated */
  constraint?: string;
  /** Optional FHIR issue code identifying the error type */
  code?: string;
  /** Optional actual value that caused the validation error */
  value?: any;
}
