import { pick } from 'lodash-es'

/**
 * Filters a FHIR resource to include only specified elements/properties.
 * Used to implement the _elements search parameter functionality according to FHIR specification.
 *
 * @param resource - The FHIR resource object to filter
 * @param filters - Comma-separated string of element paths to include in the result
 * @returns A new object containing only the specified elements from the original resource
 */
export const elements = (resource: any, filters: string): any => {
  return pick(resource, filters.split(',').map((e) => e.trim()))
}