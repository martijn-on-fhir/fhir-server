import { BundleEntry } from './bundle-entry'

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
