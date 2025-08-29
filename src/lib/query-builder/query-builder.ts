import { SearchParameters } from '../../interfaces/search-parameters'
import { set } from 'lodash-es'
import { SortOrder } from 'mongoose'

/**
 * A class to build database queries with configurable parameters such as resources, search conditions,
 * projection of fields, pagination, and sorting. QueryBuilder is designed to support complex query logic
 * and dynamic construction of search conditions based on input parameters.
 */
export class QueryBuilder {
  
  /**
   * When search for a specific resource by id, this is the id of the resource
   */
  private readonly _id: string | undefined = undefined
  
  /**
   * List of resources for the query builder. in case of search by _type there can be more than one resource
   */
  private readonly _resources: string[] = []
  
  /**
   * Search parameters for the query builder
   */
  private readonly _searchParams: SearchParameters = {}
  
  /**
   * Projection object that specifies which fields to include/exclude in the query results
   */
  private _projection: any
  
  /**
   * MongoDB query object that holds the search conditions
   */
  private _condition: any = {}
  
  /**
   * Maximum number of results to return per page. Defaults to 20
   */
  private _count: number = 20
  
  /**
   * Number of results to skip for pagination
   */
  private _offset: number = 0
  
  /**
   * Sort order configuration for query results
   */
  private _sort: any = {}
  
  /**
   * List of allowed search parameters for the query builder when id is set (single resource)
   */
  allowedParams: string[] = ['_count', '_sort', '_elements', '_include', '_summary', '_revinclude']
  
  /**
   * List of defined search parameters for the query builder according fhir hl7 secification
   */
  definedParams: string[] = ['_id', '_count', '_sort', '_elements', '_include', '_summary', '_security', '_tag', 'identifier', '_profile', '_text']
  
  /**
   * Creates an instance of the class.
   *
   * @param {string | string[]} resource - A single resource or an array of resources.
   * @param {SearchParameters} [searchParams] - Optional search parameters for the instance.
   * @param {string} [id] - Optional unique identifier for the instance. If not provided, it will default to the '_id' from searchParams if available.
   * @return {void}
   */
  constructor(resource: string | string[], searchParams?: SearchParameters, id?: string) {
    
    this._resources = Array.isArray(resource) ? resource : [resource]
    this._searchParams = searchParams ?? {}
    
    if (typeof id === 'string' || typeof this._searchParams._id === 'string') {
      this._id = typeof id === 'string' ? id : this._searchParams._id
    }
    
    this._count = this._searchParams._count ? +this._searchParams._count : 20
    this._offset = this._searchParams._offset ? +this._searchParams._offset : 0
    
    set(this._condition, 'resourceType', this.resources.length > 1 ? { $in: this.resources } : this.resources[0])
    
    this.init()
  }
  
  /**
   * Initializes the object by iterating over `_searchParams`. Removes unwanted parameters
   * not included in `allowedParams` if `_id` is present. Formats parameter names and invokes
   * corresponding methods dynamically based on parameter naming patterns.
   *
   * @return {void} This method does not return any value.
   */
  private init(): void {
    
    for (const key in this._searchParams) {
      
      if (this._id && !this.allowedParams.includes(key)) {
        delete this._searchParams[key]
      }
      
      let name: string
      
      if(this.definedParams.includes(key)) {
        
        if (key.startsWith('_')) {
          name = key.substring(1).charAt(0).toUpperCase() + key.substring(2)
        } else {
          name = key.charAt(0).toUpperCase() + key.substring(1)
        }
        
        const fnc = `append${name}`
        
        if (typeof (this as any)[fnc] === 'function') {
          this[fnc]()
        }
      }
    }
  }
  
  /**
   * Processes the `_summary` parameter in the search parameters and modifies the `_projection` property based on its value.
   * This method evaluates the `_summary` string, and depending on its content (`count`, `text`, `data`, `true`, or `false`),
   * adjusts the fields included or excluded in the `_projection`.
   *
   * @return {void} This method does not return any value. It updates the `_projection` property of the object in-place.
   */
  appendSummary(): void {
    
    if (this._searchParams._summary && typeof this._searchParams._summary === 'string') {
      
      const type = this._searchParams._summary.toLowerCase()
      
      switch (type) {
        
        case 'count': {
          // can only be applied afterward
          break
        }
        
        case 'text': {
          
          this._projection = {
            _id: 0,
            id: 1,
            resourceType: 1,
            meta: 1,
            text: 1,
            implicitRules: 1,
            language: 1
          }
          break
        }
        
        case 'data': {
          
          this._projection = {
            _id: 0,
            text: 0,
          }
          break
        }
        
        case 'true': {
          // can only be applied afterward
          break
        }
        
        case 'false': {
          
          this._projection = {
            _id: 0
          }
          break
        }
      }
    }
  }
  
  /**
   * Processes the `_elements` property of the `_searchParams` if it exists and is a string.
   * Splits the string by commas, trims each field, and constructs a projection object.
   * Sets the `_projection` property with the resulting object.
   *
   * @return {void} This method does not return a value.
   */
  private appendElements(): void {
    
    if (this._searchParams._elements && typeof this._searchParams._elements === 'string') {
      
      const elementsArray = this._searchParams._elements.split(',').map(field => field.trim())
      const selectObject = elementsArray.reduce((acc, field) => {
        acc[field] = 1
        return acc
      }, {} as Record<string, number>)
      
      selectObject._id = 0
      
      if(!selectObject.resourceType) {
        selectObject.resourceType = 1
      }
      
      this._projection = selectObject
    }
  }
  
  /**
   * Appends security configurations to the condition object by processing
   * security-related search parameters and constructing the desired security
   * structure.
   *
   * @return {void} This method does not return any value.
   */
  private appendSecurity(): void {
    
    this.condition.security = []
    const entities: string[] = []
    
    if (typeof this._searchParams['_security'] === 'string') {
      entities.push(this._searchParams['_security'])
    }
    
    for (const identifier of entities) {
      
      const [system, value] = identifier.split('|')
      const config = {
        system
      }
      
      if (value) {
        Object.assign(config, {
          value
        })
      }
      
      set(this._condition, 'meta.security', config)
    }
  }
  
  /**
   * Appends a tag filter to the search query.
   * If a tag value is provided, it will be added to the resource's meta.tag criteria.
   * This allows filtering resources based on their associated tags.
   *
   * @param tag - The tag value to filter by
   */
  private appendTag(): void {
    
    let tag: string[] = []
    
    if (this._searchParams['_tag'] && typeof this._searchParams['_tag'] === 'string') {
      tag = this._searchParams['_tag']?.split(',').map(tag => tag.trim())
    } else if (this._searchParams._tag && Array.isArray(this._searchParams._tag)) {
      tag = this._searchParams._tag
    }
    
    if (this._searchParams['_tag']) {
      set(this._condition, 'meta.tag', tag)
    }
  }
  
  /**
   * Processes and appends identifier(s) into the `_condition` object based on the `_searchParams.identifier` parameter.
   * Converts identifiers into a standardized format, separating system and value where applicable.
   * If no valid identifiers are found, the identifier field in `_condition` is removed.
   *
   * @return {void} No return value.
   */
  private appendIdentifier(): void {
    
    if (typeof this._searchParams.identifier === 'string' || Array.isArray(this._searchParams.identifier)) {
      
      this._condition.identifier = []
      const identifiers: string[] = []
      
      if (typeof this._searchParams.identifier === 'string') {
        identifiers.push(this._searchParams.identifier)
      }
      
      if (Array.isArray(this._searchParams.identifier)) {
        identifiers.push(...this._searchParams.identifier)
      }
      
      for (const identifier of identifiers) {
        
        const [system, value] = identifier.split('|')
        const config = {
          system
        }
        
        if (value) {
          Object.assign(config, {
            value
          })
        }
        
        this._condition.identifier = config
      }
      
      if (this._condition.identifier.length === 0) {
        delete this._condition.identifier
      }
    }
  }
  
  /**
   * Appends a profile filter to the search query.
   * If a profile URL is provided, it will be added to the resource's meta.profile criteria.
   * This allows filtering resources based on their conformance to specific FHIR profiles.
   */
  private appendProfile(): void {
    
    if (this._searchParams['_profile'] && typeof this._searchParams['_profile'] === 'string') {
      set(this._condition, 'meta.profile', this._searchParams['_profile'])
    }
  }
  
  /**
   * Generates and assigns a sorting configuration object for the current search context.
   * The method sets a default descending sort order based on the `meta.lastUpdated` field if no sorting parameters are provided.
   * If custom sorting parameters are present, it parses them to create a sorting configuration where each field can have either ascending or descending order.
   *
   * @return {void} This method does not return any value.
   */
  private appendSort(): void {
    
    if (!this._searchParams._sort) {
      this._sort = { 'meta.lastUpdated': -1 }
    } else {
      
      const sortOrder: Record<string, SortOrder> = {}
      const entities = this._searchParams._sort.split(',').map(e => e.trim())
      
      entities.forEach((e: string) => {
        
        if (e.startsWith('-')) {
          Object.defineProperty(sortOrder, e.substring(1), {
            value: -1
          })
        } else {
          Object.defineProperty(sortOrder, e, {
            value: 1
          })
        }
      })
      
      this._sort = sortOrder
    }
  }
  
  /**
   * Appends text-based search conditions to a query based on the `_text` parameter in `this._searchParams`.
   * This method supports exact phrase search, boolean search (AND/OR), negative search (exclusion),
   * and simple term search. It modifies the `this._condition` object to include `$text` search criteria
   * and ensures the presence of text fields by verifying `text.div` existence.
   *
   * @return {void} Does not return any value. Modifies the query condition in place.
   */
  private appendText(): void {
    
    if (this._searchParams._text && typeof this._searchParams._text === 'string') {
      
      // Handle exact phrase search with quoted text
      // Example: _text="diabetes mellitus" -> matches exact phrase
      if (this._searchParams._text.includes('"')) {
        
        const phrase = this._searchParams._text.replace(/"/g, '')
        
        set(this._condition, '$text', {
          $search: `"${phrase}"`,  // MongoDB phrase search with quotes
          $caseSensitive: false
        })
      }
        // Handle boolean search with AND/OR operators
        // Example: _text=diabetes AND medication -> matches both terms
      // Example: _text=diabetes OR medication -> matches either term
      else if (this._searchParams._text.includes(' AND ') || this._searchParams._text.includes(' OR ')) {
        
        set(this._condition, '$text', {
          $search: this._searchParams._text.replace(/ AND /g, ' ').replace(/ OR /g, ' | '),
          $caseSensitive: false
        })
      }
        // Handle negative search with leading minus
      // Example: _text=-cancer -> excludes documents containing "cancer"
      else if (this._searchParams._text.startsWith('-')) {
        
        set(this._condition, '$text', {
          $search: this._searchParams._text,  // MongoDB handles - for exclusion natively
          $caseSensitive: false
        })
      }
        // Handle simple single term search
      // Example: _text=diabetes -> matches documents containing "diabetes"
      else {
        
        set(this._condition, '$text', {
          $search: `${this._searchParams._text.trim()}`,
          $caseSensitive: false
        })
      }
      
      set(this._condition, 'text.div', { $exists: true })
    }
  }
  
  /**
   * Transforms a nested object into dot notation format that Mongoose can effectively use for querying.
   * This method recursively flattens nested objects into a single-level object where nested keys
   * are represented using dot notation (e.g., 'parent.child.grandchild').
   *
   * @param query - The nested object to transform
   * @param prefix - The prefix to prepend to the keys (used for recursion)
   * @returns An object with flattened structure using dot notation
   */
  private transform(query: any, prefix: string = ''): any {
    
    const transformed: any = {}
    
    // MongoDB operators that shouldn't be flattened
    const mongoOperators = new Set([
      '$and', '$or', '$not', '$nor', '$elemMatch', '$text',
      '$exists', '$ne', '$gte', '$gt', '$lte', '$lt', '$eq',
      '$in', '$nin', '$type', '$size', '$regex', '$options',
      '$all', '$where', '$expr', '$mod', '$geoIntersects', '$geoWithin',
      '$near', '$nearSphere', '$meta', '$slice', '$search', '$caseSensitive'
    ])
    
    // Helper function to check if object contains only MongoDB operators
    const isOperatorObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false
      }
      
      const keys = Object.keys(obj)
      return keys.length > 0 && keys.every(key => mongoOperators.has(key))
    }
    
    for (const key in query) {
      
      if (query.hasOwnProperty(key)) {
        const currentKey = prefix ? `${prefix}.${key}` : key
        const value = query[key]
        
        // Don't flatten MongoDB operators at the key level
        if (mongoOperators.has(key)) {
          transformed[currentKey] = value
        }
        // Don't flatten objects that contain only MongoDB operators
        else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !isOperatorObject(value)) {
          Object.assign(transformed, this.transform(value, currentKey))
        }
        // Keep everything else as-is (including operator objects)
        else {
          transformed[currentKey] = value
        }
      }
    }
    
    return transformed
  }
  
  get condition(): any {
    return this.transform(this._condition)
  }
  
  get count(): number {
    return this._count
  }
  
  get offset(): number {
    return this._offset
  }
  
  get sort(): any {
    return this._sort
  }
  
  get id(): string | undefined {
    return this._id
  }
  
  get searchParams(): SearchParameters {
    return this._searchParams
  }
  
  get resources(): string[] {
    return this._resources
  }
  
  get projection(): any {
    return this._projection
  }
}