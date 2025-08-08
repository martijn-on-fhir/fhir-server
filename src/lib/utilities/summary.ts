import { SummaryType } from '../../interfaces/search-parameters'
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema'
import { Model } from 'mongoose'
import {first, uniq, pick} from 'lodash-es'

/**
 * Extracts summary properties from a FHIR structure definition
 * @param properties - Array of property names to filter
 * @param structure - FHIR structure definition document
 * @returns Array of property names that are marked as summary
 */
const getSummaryProperties = (properties, structure):any => {
  
  const definition = structure.definition.snapshot.element.filter((e) => {
   
    const parts = e.path.split('.')
    const property = parts[1]
    
    return e.isSummary === true && properties.indexOf(property) !== -1 && parts.length === 2
  })
  
  return uniq(definition.map((d) => {
    return d.path.split('.')[1]
  }))
}

/**
 * Filters a FHIR resource based on the requested summary type
 * @param resource - FHIR resource to be summarized
 * @param type - Type of summary to generate (count, text, data, true, false)
 * @param model - Mongoose model for StructureDefinition
 * @returns Promise resolving to the filtered resource based on summary type
 */
export  const summary = async (resource: any, type: SummaryType, model: Model<StructureDefinitionDocument>): Promise<any> => {
  
  const properties = Object.keys(resource)
  const profile = first(resource.meta.profile)
  
  if(!resource || !profile) {
    return resource
  }
  
  const structure = await model.findOne({url: profile}).exec()
  
  switch (type) {
    
    case 'count':
      return {
        resourceType: resource.resourceType,
        id: resource.id,
        total: 1
      }
    
    case 'text': {
      return pick(resource, ['resourceType', 'id', 'meta', 'text', 'implicitRules', 'language'])
    }
    
    case 'data': {
      const result = { ...resource }
      delete result.text
      return result
    }
    
    case 'true': {
      const summaryProps = ['resourceType', 'id', 'meta', 'implicitRules', 'language']
      const additionalProps = getSummaryProperties(properties, structure)
      return pick(resource, [...summaryProps, ...additionalProps])
    }
    
    case 'false':
      return resource
    
    default: return resource
  }
}