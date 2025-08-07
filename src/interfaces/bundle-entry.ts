/**
 * Represents an entry in a FHIR Bundle resource.
 * Each entry contains a resource and associated metadata about how it was included in the bundle.
 */
export interface BundleEntry {
  /**
   * The fully qualified URL for the resource, usually pointing to the server location.
   * Optional as some resources may not have a permanent URL.
   */
  fullUrl?: string
  
  /**
   * The actual FHIR resource being carried in the entry.
   * Can be any valid FHIR resource type.
   */
  resource?: any
  
  /**
   * Search metadata about how this entry was included in search results.
   * Used when the bundle represents search results.
   */
  search?: {
    mode: 'match' | 'include';  // Whether this resource matched search criteria or was included via _include
    score?: number             // Search ranking score if the server supports scoring
  }
}