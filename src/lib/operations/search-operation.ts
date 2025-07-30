import { Operation } from './operation';
import { Model, SortOrder } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { NotFoundException } from '@nestjs/common';
import { FhirResponse } from '../fhir-response';

/**
 * Handles FHIR search operations for resources in the database.
 * Provides functionality for searching resources by various criteria,
 * including resource type, identifier, and pagination support.
 */
export class SearchOperation extends Operation {
  
  count: number = 20;
  
  offset: number = 0;
  
  sort: Record<string, SortOrder> = { 'resource.meta.lastUpdated': 1 };
  
  filter: any = {
    resourceType: 'Patient',
  };
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  /**
   * Retrieves a specific FHIR resource by its type and ID.
   *
   * @param resourceType - The type of FHIR resource to search for (e.g., 'Patient', 'Observation')
   * @param id - The unique identifier of the resource
   * @returns Promise resolving to the formatted FHIR resource
   * @throws NotFoundException if the resource is not found
   */
  async findById(resourceType: string, id: string): Promise<any> {
    
    const resource = await this.fhirResourceModel.findOne({
      resourceType, 'resource.id': id,
    }).exec();
    
    if (!resource) {
      
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: `${resourceType}/${id} not found`,
          },
        }],
      });
    }
    
    return FhirResponse.format(resource);
  }
  
  /**
   * Searches for FHIR resources based on search parameters.
   * Supports pagination and filtering by resource type and identifiers.
   *
   * @param resourceType - The type of FHIR resource to search for
   * @param searchParams - Search parameters including _count, _offset, and identifier
   * @returns Promise resolving to a FHIR Bundle containing matching resources
   */
  async find(resourceType: string, searchParams: any): Promise<any> {
    
    this.filter = {
      resourceType,
      resource: {},
    };
    
    this.count = searchParams._count ? parseInt(searchParams._count) : 20;
    this.offset = searchParams._offset ? parseInt(searchParams._offset) : 0;
    
    this.appendId(searchParams?._id)
    this.appendIdentifier(searchParams?.identifier);
    
    const query = this.transformToDotNotation(this.filter);
    console.dir(query);
    
    const resources = await this.fhirResourceModel
    .find(query)
    .skip(this.offset)
    .limit(this.count)
    .sort(this.sort)
    .exec();
    
    const total = await this.fhirResourceModel.countDocuments(query);
    
    return FhirResponse.bundle(resources, total, resourceType, this.offset, this.count);
  }
  
  /**
   * Appends an ID filter to the search query.
   * If an ID is provided, it will be added to the resource filter criteria.
   *
   * @param id - The unique identifier to filter by
   */
  appendId(id: string): void {
    
    if(id){
      this.filter.resource.id = id;
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
    
    this.filter.resource.identifier = [];
    const identifiers: string[] = [];
    
    if (typeof entity === 'string') {
      identifiers.push(entity);
    }
    
    for (const identifier of identifiers) {
      
      const [system, value] = identifier.split('|');
      const config = {
        system,
      };
      
      if (value) {
        Object.assign(config, {
          value,
        });
      }
      
      this.filter.resource.identifier = config;
    }
    
    if (this.filter.resource.identifier.length === 0) {
      delete this.filter.resource.identifier;
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
   * @private
   *
   * @example
   * // Input:
   * {
   *   resource: {
   *     identifier: {
   *       system: 'http://example.com'
   *     }
   *   }
   * }
   * // Output:
   * {
   *   'resource.identifier.system': 'http://example.com'
   * }
   */
  private transformToDotNotation(nestedQuery: any, prefix: string = ''): any {
    
    const transformed: any = {};
    
    for (const key in nestedQuery) {
      if (nestedQuery.hasOwnProperty(key)) {
        
        const currentKey = prefix ? `${prefix}.${key}` : key;
        const value = nestedQuery[key];
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(transformed, this.transformToDotNotation(value, currentKey));
        } else {
          transformed[currentKey] = value;
        }
      }
    }
    
    return transformed;
  }
}
