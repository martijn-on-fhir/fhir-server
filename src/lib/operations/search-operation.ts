import { Operation } from './operation'
import { Model } from 'mongoose'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { NotFoundException } from '@nestjs/common'
import { FhirResponse } from '../fhir-response'
import { set } from 'lodash-es'
import { SearchResult } from '../../interfaces/search-result'
import { SearchParameters } from '../../interfaces/search-parameters'
import { IncludeOperation } from './include-operation'
import { Request } from 'express'
import { elements } from '../utilities/elements'
import { summary } from '../utilities/summary'
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema'
import { setSortOrder } from '../utilities/sort'
import { text } from '../utilities/text'

/**
 * Handles FHIR search operations for resources in the database.
 * Provides functionality for searching resources by various criteria,
 * including resource type, identifier, and pagination support.
 *
 * This class implements standard FHIR search operations allowing:
 * - Search by resource type and ID
 * - Filtering by identifiers
 * - Support for _include parameters to fetch referenced resources
 * - Pagination using _count and _offset parameters
 * - Filtering by profiles and tags
 * - Element filtering using _elements parameter
 * - Summary views using _summary parameter
 */
export class SearchOperation extends Operation {
  
  /** Number of resources to return per page. Defaults to 20. */
  count: number = 20
  
  /** Number of resources to skip for pagination. Defaults to 0. */
  offset: number = 0
  
  /** Filter criteria for the search query. Defaults to Patient resource type. */
  filter: any = {
    resourceType: 'Patient'
  }
  
  /** Array of included resources resolved from _include parameters */
  includes: any[] = []
  
  /** Array of reverse included resources resolved from _revinclude parameters */
  revIncludes: any[] = []
  
  /** Express request object used for building response URLs */
  request: Request
  
  /**
   * Creates an instance of SearchOperation.
   *
   * @param fhirResourceModel - Mongoose model for accessing FHIR resources
   * @param request - Express request object used for building response URLs
   * @param structureDefinitonModel - Mongoose model for accessing FHIR StructureDefinitions
   *                                 used in _summary operations
   */
  constructor(fhirResourceModel: Model<FhirResourceDocument>, request: Request, private readonly structureDefinitonModel: Model<StructureDefinitionDocument>) {
    
    super(fhirResourceModel)
    
    this.fhirResourceModel = fhirResourceModel
    this.request = request
  }
  
  /**
   * Searches for FHIR resources by their resource types.
   * Allows searching across multiple resource types in a single query.
   *
   * @param resources - Array of FHIR resource types to search for (e.g., ['Patient', 'Practitioner'])
   * @param searchParameters - Search parameters object containing query criteria
   * @returns Promise resolving to a FHIR Bundle containing matching resources
   * @throws Returns error if the database query fails
   */
  async findByType(resources: string[], searchParameters: SearchParameters): Promise<any> {
    
    if (searchParameters._type) {
      delete searchParameters._type
    }
    
    const query = { resourceType: { $in: resources } }
    const total = await this.fhirResourceModel.countDocuments(query)
    
    const entities = await this.fhirResourceModel.find(query)
    .select('-_id')
    .lean()
    .then(resources => {
      return resources
    })
    .catch(error => {
      return error
    })
    
    return FhirResponse.bundle(entities, total, '', this.offset, this.count, this.request)
  }
  
  /**
   * Retrieves a specific FHIR resource by its type and ID.
   *
   * @param resourceType - The type of FHIR resource to search for (e.g., 'Patient', 'Observation')
   * @param id - The unique identifier of the resource
   * @param searchParameters
   * @returns Promise resolving to the formatted FHIR resource
   * @throws NotFoundException if the resource is not found
   */
  async findById(resourceType: string, id: string, searchParameters?: SearchParameters): Promise<any> {
    
    let resource = await this.fhirResourceModel.findOne({
      resourceType, id
    })
    .select('-_id')
    .lean()
    
    if (!resource) {
      
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: `${resourceType}/${id} not found`
          }
        }]
      })
    }
    
    if (searchParameters?._include) {
      const operation = new IncludeOperation(resource, this.fhirResourceModel, this.request)
      
      this.includes = await operation.execute(searchParameters._include)
      
      if (this.includes.length >= 1) {
        return operation.getResponse()
      }
    }
    
    if (searchParameters?._elements && typeof searchParameters._elements === 'string') {
      resource = elements(resource, searchParameters._elements)
    } else if (searchParameters?._summary && typeof searchParameters._summary === 'string') {
      resource = await summary(resource, searchParameters._summary, this.structureDefinitonModel)
    }
    
    return FhirResponse.format(resource)
  }
  
  /**
   * Searches for FHIR resources based on search parameters.
   * Supports pagination and filtering by resource type and identifiers.
   *
   * @param resourceType - The type of FHIR resource to search for
   * @param searchParams - Search parameters including _count, _offset, and identifier
   * @returns Promise resolving to a FHIR Bundle containing matching resources
   */
  async find(resourceType: string, searchParams: SearchParameters): Promise<SearchResult> {
    
    this.filter = {
      resourceType
    }
    
    if (searchParams) {
      
      this.count = searchParams._count ? searchParams._count : 20
      this.offset = searchParams._offset ? searchParams._offset : 0
      
      if (searchParams._id) {
        this.appendId(searchParams._id)
      }
      
      if (searchParams.identifier) {
        this.appendIdentifier(searchParams.identifier)
      }
      
      if (searchParams._profile) {
        this.appendProfile(searchParams._profile)
      }
      
      if (searchParams._tag) {
        this.appendTag(searchParams._tag)
      }
      
      if (searchParams._text || searchParams._content) {
        
        const term = searchParams._text ?? searchParams._content
        
        if (typeof term !== 'string') {
          throw new Error('Invalid search term')
        }
        
        const type = searchParams._text ? '_text' : '_content'
        this.filter = text(term, type)
      }
    }
    
    const query = this.transform(this.filter)
    
    const resources = await this.fhirResourceModel
    .find(query)
    .skip(this.offset)
    .limit(this.count)
    .sort(setSortOrder(searchParams['_sort']))
    .select('-_id')
    .lean()
    
    const total = await this.fhirResourceModel.countDocuments(query)
    
    return FhirResponse.bundle(resources, total, resourceType, this.offset, this.count, this.request)
  }
  
  /**
   * Appends an ID filter to the search query.
   * If an ID is provided, it will be added to the resource filter criteria.
   *
   * @param id - The unique identifier to filter by
   */
  appendId(id: string): void {
    
    if (id) {
      this.filter.id = id
    }
  }
  
  /**
   * Processes and appends identifier filters to the search query.
   * Handles both single string and array of identifier strings in the format "system|value".
   *
   * @param entity - Single identifier string or array of identifier strings
   * @private
   */
  private appendIdentifier(entity: string | string[]): void {
    
    this.filter.identifier = []
    const identifiers: string[] = []
    
    if (typeof entity === 'string') {
      identifiers.push(entity)
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
      
      this.filter.identifier = config
    }
    
    if (this.filter.identifier.length === 0) {
      delete this.filter.identifier
    }
  }
  
  /**
   * Appends a profile filter to the search query.
   * If a profile URL is provided, it will be added to the resource's meta.profile criteria.
   * This allows filtering resources based on their conformance to specific FHIR profiles.
   *
   * @param profile - The profile URL to filter by
   * @private
   */
  private appendProfile(profile: string): void {
    
    if (profile) {
      set(this.filter, 'meta.profile', profile)
    }
  }
  
  /**
   * Appends a tag filter to the search query.
   * If a tag value is provided, it will be added to the resource's meta.tag criteria.
   * This allows filtering resources based on their associated tags.
   *
   * @param tag - The tag value to filter by
   */
  private appendTag(tag: string): void {
    
    if (tag) {
      set(this.filter, 'meta.tag', tag)
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
}
