import { BundleEntry } from './bundle-entry'

export interface SearchResult {
  resourceType: 'Bundle';
  id: string;
  type: 'searchset';
  total: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry: BundleEntry[]
}
