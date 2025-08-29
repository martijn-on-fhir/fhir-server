import { Model } from 'mongoose'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { searchParameterMap } from '../search-parameter-map'
import { OperationHelpers } from './operation-helpers'
import * as fhirPath from 'fhirpath'
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
   * @param request - Express request object for context
   */
  constructor(private readonly model: any, private readonly fhirResourceModel: Model<FhirResourceDocument>, private readonly request: Request) {
    
    this.resource = this.model
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
    const instructions = entities.map(OperationHelpers.parseInstruction)
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
   * Retrieves a referenced resource by its type and ID.
   * @param resource - The type of the referenced resource
   * @param id - The ID of the referenced resource
   * @returns The referenced resource if found
   */
  private async getReference(resource: string, id: string): Promise<any> {
    
    const entity = await this.fhirResourceModel.findOne({
      resourceType: resource, 'id': id,
    }).lean().exec();
    
    if(entity){
      return entity.id === id ? entity : undefined
    }
  }
}
