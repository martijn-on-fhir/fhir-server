import { FhirResourceDocument } from '../schema/fhir-resource-schema';
import { v4 as uuidv4 } from 'uuid';

export class FhirResponse {
  
  static format(resource) {
    
    return {
      ...resource.resource,
      meta: resource.meta,
    }
  }
  
  static bundle(resources: FhirResourceDocument[], total: number, resourceType: string, offset: number = 0, count: number = 20): any {
    
    return {
      resourceType: 'Bundle',
      id: uuidv4(),
      type: 'searchset',
      total,
      link: [{
          relation: 'self',
          url: `${resourceType}?_offset=${offset}&_count=${count}`,
        },
        
        ...(offset + count < total ? [{
          relation: 'next',
          url: `${resourceType}?_offset=${offset + count}&_count=${count}`,
        }] : []),
       
        ...(offset > 0 ? [{
          relation: 'previous',
          url: `${resourceType}?_offset=${Math.max(0, offset - count)}&_count=${count}`,
        }] : [])
      ],
      entry: resources.map(resource => ({
        fullUrl: `${resourceType}/${resource.id}`,
        resource: FhirResponse.format(resource),
        search: {
          mode: 'match',
        }
      }))
    }
  }
}
