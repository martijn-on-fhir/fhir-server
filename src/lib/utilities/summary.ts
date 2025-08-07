import { SummaryType } from '../../interfaces/search-parameters'
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema'
import { Model } from 'mongoose'
import {first} from 'lodash-es'

export  const summary = async (resource: any, type: SummaryType, model: Model<StructureDefinitionDocument>): any => {
  
  const properties = Object.keys(resource)
  const profile = first(resource.profile)
  const structure = await model.find(s => s.url === profile).then((s: any): any => {
    return s.toObject()
  })
  
  if(!resource || !profile) {
    return resource
  }
  
  switch (type) {
    
    case 'count':
      return { total: 1 }
    
    case 'text':
      return resource.map(
        (r: any) => r.text?.div
      )
    
    case 'data':
      return resource.map(
        (r: any) => r.text?.div
      )
    
    case 'true':
      return resource
    
    case 'false':
      return resource
    
    default: return resource
  }
}