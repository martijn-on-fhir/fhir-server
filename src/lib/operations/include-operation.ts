import { Model } from 'mongoose'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { searchParameterMap } from '../search-parameter-map'
import { IncludeInstruction } from '../../interfaces/include-instruction'
import { BadRequestException } from '@nestjs/common'
import * as fhirPath from 'fhirpath'
import { v4 as uuidv4 } from 'uuid';
import { SearchResult } from '../../interfaces/search-result'
import { Request } from 'express';

/**
 * Handles FHIR _include operations to fetch referenced resources.
 * Processes include instructions and resolves resource references
 * according to FHIR search parameter definitions.
 */
export class IncludeOperation {
  
  /** Collection of resolved resources including the primary resource and referenced resources */
  collection: any[] = []
  
  /** The primary FHIR resource being processed */
  resource
  
  /**
   * Creates an instance of IncludeOperation.
   * @param model - The source model containing the primary resource
   * @param fhirResourceModel - Mongoose model for FHIR resources
   * @param request
   */
  constructor(private readonly model: any, private readonly fhirResourceModel: Model<FhirResourceDocument>, private readonly request: Request) {
    
    this.resource = this.model.resource
    this.collection = []
  }
  
  /**
   * Executes the include operation based on provided include instructions.
   * Resolves references from the primary resource and fetches the referenced resources.
   * @param includes - Single include instruction or array of include instructions
   * @returns Collection of resolved resources including primary and referenced resources
   */
  async execute(includes: string | string[]): Promise<any[]> {
    
    const entities = Array.isArray(includes) ? includes : [includes]
    const instructions = entities.map(this.parseInstruction)
    const references = new Map<string, { resource: string, id: string }>()
    
    for (const instruction of instructions) {
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sourceResource, searchParameter, targetResource, modifier, iterate } = instruction
      const defination = searchParameterMap.get(`${sourceResource}:${searchParameter}`)
      
      if (defination) {
        
        const { path } = defination
        const values = fhirPath.evaluate(this.resource,`${path}`)
        
        if (Array.isArray(values)) {
          
          for (const value of values) {
            
            if (typeof value === 'string') {
              
              const [resource, id] = value.split('/')
              references.set(path, {
                resource,
                id
              })
            }
          }
        }
      }
    }
    
    if(references.size > 0){
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [path, reference] of references) {
        
        const { resource, id } = reference
        const entity = await this.getReference(resource, id)
        
        if(entity){
          this.collection.push(entity)
        }
      }
    }

    return this.collection
  }
  
  /**
   * Formats and returns the search results as a FHIR Bundle resource.
   * Creates a Bundle containing the primary resource and any included referenced resources.
   * The Bundle follows the FHIR searchset structure with appropriate search modes for
   * primary and included resources.
   */
  getResponse(): SearchResult {
    
    const hostUrl = this.request.get('secure') ?  `https://${this.request.get('host')}` : `http://${this.request.get('host')}`
    
    const response = {
      id: uuidv4(),
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [
        {
          fullUrl: `${hostUrl}/fhir/${this.resource.resourceType}/${this.resource.id}`,
          resource: this.resource,
          search: {
            mode: "match",
            score: 1
          }
        }
      ]
    }
    
    for(const resource of this.collection){
      
      const entry = {
        fullUrl: `${hostUrl}/fhir/${resource.resourceType}/${resource.id}`,
        resource: resource,
        search: { mode: "include", score: 1 }
      }
      
      response.entry.push(entry)
    }
    
    return response
  }
  
  /**
   * Retrieves a referenced resource by its type and ID.
   * @param resource - The type of the referenced resource
   * @param id - The ID of the referenced resource
   * @returns The referenced resource if found
   */
  private async getReference(resource: string, id: string): Promise<any> {
    
    const entity = await this.fhirResourceModel.findOne({
      resourceType: resource, 'id': id,
    }).exec();
    
    if(entity){
      return entity.id === id ? entity.id : undefined
    }
  }
  
  /**
   * Parses an include instruction string into structured format.
   * Format: sourceResource:searchParameter[:targetResource[:modifier]]
   * @param include - The include instruction string to parse
   * @returns Parsed include instruction object
   * @throws BadRequestException if the include format is invalid
   */
  private parseInstruction(include: string): IncludeInstruction {
    
    const parts = include.split(':')
    
    if (parts.length < 2) {
      throw new BadRequestException(`Invalid _include format: ${include}`)
    }
    
    const [sourceResource, searchParameter, targetResource, modifier] = parts
    
    return {
      sourceResource,
      searchParameter,
      targetResource: targetResource !== '*' ? targetResource : undefined,
      modifier,
      iterate: modifier === 'iterate'
    }
  }
}
