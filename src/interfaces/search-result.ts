export interface SearchResult {
  resourceType: 'Bundle';
  id: string;
  type: 'searchset';
  total: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry: Array<{
    fullUrl: string;
    resource: any;
    search: {
      mode: 'match' | 'include';
      score?: number;
    };
  }>;
}
