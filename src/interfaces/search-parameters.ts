/**
 *
 * true	  Return a limited subset of elements from the resource. This subset SHOULD consist solely of all supported elements that are marked as "summary" in the base definition of the resource(s) (see ElementDefinition.isSummary)
 * text	  Return only the "text" element, the 'id' element, the 'meta' element, and only top-level mandatory elements
 * data	  Remove the text element
 * count	Search only: just return a count of the matching resources, without returning the actual matches
 * false	Return all parts of the resource(s)
 */
export type SummaryType = 'true' | 'text' | 'data' | 'count' | 'false'

export interface SearchParameters {
  _id?: string
  _count?: number
  _offset?: number
  _sort?: string
  _include?: string | string[]
  _rev_include?: string | string[],
  identifier?: string
  _profile?: string
  _summary?: SummaryType
  _elements?: string
}