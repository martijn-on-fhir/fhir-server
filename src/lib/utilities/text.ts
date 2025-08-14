/**
 * Constructs MongoDB text search query based on different search patterns
 * @param searchTerm - The search text to query for
 * @param field - The field to search in, either '_text' or '_content'
 * @returns MongoDB query object for text search
 */
export const text = (searchTerm: string, field: '_text' | '_content'): Record<string, any> => {
  
  if (!searchTerm || typeof searchTerm !== 'string') return {}
  
  let query: Record<string, any>
  
  // Handle exact phrase search with quoted text
  // Example: _text="diabetes mellitus" -> matches exact phrase
  if (searchTerm.includes('"')) {
    const phrase = searchTerm.replace(/"/g, '')
    query = {
      $text: {
        $search: `"${phrase}"`,  // MongoDB phrase search with quotes
        $caseSensitive: false
      }
    }
  }
  // Handle boolean search with AND/OR operators
    // Example: _text=diabetes AND medication -> matches both terms
  // Example: _text=diabetes OR medication -> matches either term
  else if (searchTerm.includes(' AND ') || searchTerm.includes(' OR ')) {
    query = {
      $text: {
        $search: searchTerm.replace(/ AND /g, ' ').replace(/ OR /g, ' | '),
        $caseSensitive: false
      }
    }
  }
    // Handle negative search with leading minus
  // Example: _text=-cancer -> excludes documents containing "cancer"
  else if (searchTerm.startsWith('-')) {
    query = {
      $text: {
        $search: searchTerm,  // MongoDB handles - for exclusion natively
        $caseSensitive: false
      }
    }
  }
    // Handle simple single term search
  // Example: _text=diabetes -> matches documents containing "diabetes"
  else {
    query = {
      $text: {
        $search: searchTerm,
        $caseSensitive: false
      }
    }
  }
  
  // Add field-specific constraints
  if (field === '_text') {
    query['text.div'] = { $exists: true }
  }
  
  return query
}