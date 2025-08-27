import { ValidationError } from './validation-error';
import { ValidationWarning } from './validation-warning';

/**
 * Result of FHIR resource validation containing status and any issues found
 */
export interface ValidationResult {
  /** Whether the resource passed validation */
  isValid: boolean;
  /** Array of validation errors that prevent resource acceptance */
  errors: ValidationError[];
  /** Array of validation warnings that don't prevent resource acceptance */
  warnings: ValidationWarning[];
}
