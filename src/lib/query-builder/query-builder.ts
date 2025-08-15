import { SearchParameters } from '../../interfaces/search-parameters'
import { set } from 'lodash-es'

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
  
  private _projection: any
  /**
   * MongoDB query object
   */
  private _query: any = {}
  
  private _count: number = 20
  
  private _offset: number = 0
  
  private _sort: any = {}
  
  /**
   * List of allowed search parameters for the query builder when id is set
   */
  allowedParams: string[] = ['_count', '_sort', '_elements', '_include', '_summary']
  
  constructor(resource: string | string[], searchParams?: SearchParameters, id?: string) {
    
    this._resources = Array.isArray(resource) ? resource : [resource]
    this._searchParams = searchParams ?? {}
    
    if (typeof id === 'string' || typeof this._searchParams._id === 'string') {
      this._id = typeof id === 'string' ? id : this._searchParams._id
    }
    
    this._count = this._searchParams._count ? +this._searchParams._count : 20
    this._offset = this._searchParams._offset ? +this._searchParams._offset : 0
    
    this.init()
  }
  
  private init(): void {
    
    for (const key in this._searchParams) {
      
      if (this._id && !this.allowedParams.includes(key)) {
        delete this._searchParams[key]
      }
      
      let name: string
      
      if(key.startsWith('_')) {
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
  
  private appendElements(): void {
    
    if(this._searchParams._elements && typeof this._searchParams._elements === 'string'){
      
      const elementsArray = this._searchParams._elements.split(',').map(field => field.trim())
      const selectObject = elementsArray.reduce((acc, field) => {
        acc[field] = 1
        return acc
      }, {} as Record<string, number>)
      
      selectObject._id = 0
      
      this._projection = selectObject
    }
  }
  
  private appendSecurity(): void {
    
    this.query.security = []
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
      
      set(this._query, 'meta.security', config)
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
    
    if(this._searchParams['_tag'] && typeof this._searchParams['_tag'] === 'string') {
      tag = this._searchParams['_tag']?.split(',').map(tag => tag.trim())
    } else if (this._searchParams._tag && Array.isArray(this._searchParams._tag)) {
      tag = this._searchParams._tag
    }
   
    if(this._searchParams['_tag']) {
      set(this._query, 'meta.tag', tag)
    }
  }
  
  private appendIdentifier(): void {
    
    if (typeof this._searchParams.identifier === 'string' || Array.isArray(this._searchParams.identifier)) {
      
      this._query.identifier = []
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
        
        this._query.identifier = config
      }
      
      if (this._query.identifier.length === 0) {
        delete this._query.identifier
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
      set(this._query, 'meta.profile', this._searchParams['_profile'])
    }
  }
  
  /**
   * Transforms a nested object into dot notation format that Mongoose can effectively use for querying.
   * This method recursively flattens nested objects into a single-level object where nested keys
   * are represented using dot notation (e.g., 'parent.child.grandchild').
   *
   * @param nestedQuery - The nested object to transform
   * @param prefix - The prefix to prepend to the keys (used for recursion)
   * @returns An object with flattened structure using dot notation
   */
  private transform(nestedQuery: any, prefix: string = ''): any {
    
    const transformed: any = {}
    
    for (const key in nestedQuery) {
      
      if (nestedQuery.hasOwnProperty(key)) {
        
        const currentKey = prefix ? `${prefix}.${key}` : key
        const value = nestedQuery[key]
        
        if ((key === '$and' || key === '$or' || key === '$not' || key === '$elemMatch' || key === '$text' || key === 'text.div')) {
          transformed[currentKey] = value
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(transformed, this.transform(value, currentKey))
        } else {
          transformed[currentKey] = value
        }
      }
    }
    
    return transformed
  }
  
  get query(): any {
    return this.transform(this._query)
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