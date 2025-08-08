import { SortOrder } from 'mongoose'

/**
 * Converts a string parameter into a MongoDB sort order object.
 * The parameter string can contain multiple fields separated by commas.
 * Fields can be prefixed with '-' to indicate descending order.
 *
 * @param parameter - Sort parameter string (e.g., "name,-age" for ascending name and descending age)
 *                   If undefined, defaults to ascending sort by 'meta.lastUpdated'
 * @returns A MongoDB sort order object where 1 indicates ascending and -1 indicates descending
 *
 * @example
 * // Returns { name: 1, age: -1 }
 * getSortOrder('name,-age')
 *
 * @example
 * // Returns { 'meta.lastUpdated': 1 }
 * getSortOrder(undefined)
 */
export const getSortOrder = (parameter: string|undefined): Record<string, SortOrder> => {
  
  if(!parameter) return {
    'meta.lastUpdated': -1
  }
  
  const sortOrder: Record<string, SortOrder> = {}
  const entities = parameter.split(',').map(e => e.trim())
  
  entities.forEach((e: string) => {
    
    if (e.startsWith('-')) {
      Object.defineProperty(sortOrder, e.substring(1), {
        value: -1,
    })
    } else {
      Object.defineProperty(sortOrder, e, {
        value: 1,
      })
    }
  })
  
  return sortOrder;
}