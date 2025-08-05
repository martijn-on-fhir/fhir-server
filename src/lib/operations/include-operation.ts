import { Model } from 'mongoose'
import { FhirResourceDocument } from '../../schema/fhir-resource-schema'
import { searchParameterMap } from '../search-parameter-map'

export class IncludeOperation {
  
  searchParameterMap = searchParameterMap
  
  constructor(private readonly resource: any, private readonly fhirResourceModel: Model<FhirResourceDocument>) {
  }
  
  async execute(includes: string | string[]): Promise<any[]> {
    
    const entities = Array.isArray(includes) ? includes : [includes];
    console.log(entities)
    return []
  }
}
