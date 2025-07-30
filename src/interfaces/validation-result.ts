import { ValidationError } from './validation-error';
import { ValidationWarning } from './validation-warning';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
