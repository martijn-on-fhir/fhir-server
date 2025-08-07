export interface SearchParameters {
  _id?: string
  _count?: number
  _offset?: number
  _sort?: string
  _include?: string | string[]
  _rev_include?: string | string[],
  identifier?: string
  _profile?: string
  _summary?: 'true' | 'text' | 'data' | 'count' | 'false'
  _elements?: string
}