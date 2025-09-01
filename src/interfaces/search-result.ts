import { BundleEntry } from './bundle-entry'

/**
 * Interface representing a FHIR Bundle search result.
 * Contains search results with pagination links and entries.
 */
export interface SearchResult {
  resourceType: string;
  id: string;
  type: string;
  total: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry: BundleEntry[]
}
