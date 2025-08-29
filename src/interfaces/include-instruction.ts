/**
 * Represents a parsed FHIR _include or _revinclude instruction
 */
export interface IncludeInstruction {
  /** The source resource type where the search starts */
  sourceResource: string;
  /** The search parameter name that defines the reference path */
  searchParameter: string;
  /** Optional target resource type to filter referenced resources */
  targetResource?: string;
  /** Optional modifier like 'iterate' for chained includes */
  modifier?: string;
  /** Whether this is an iterative include operation */
  iterate?: boolean;
}
