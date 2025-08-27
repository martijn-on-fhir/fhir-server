/**
 * Represents a validation warning encountered during FHIR resource validation
 */
export interface ValidationWarning {
  /** JSON path where the validation warning occurred */
  path: string;
  /** Human-readable description of the validation warning */
  message: string;
}
