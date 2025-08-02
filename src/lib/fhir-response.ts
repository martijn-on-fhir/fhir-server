import { FhirResourceDocument } from '../schema/fhir-resource-schema';
import { v4 as uuidv4 } from 'uuid';
import { ValidationResult } from '../interfaces/validation-result'

/**
 * Handles formatting and bundling of FHIR resources for API responses.
 * Provides utility methods to transform and package FHIR resources according to the FHIR specification.
 */
export class FhirResponse {
  
  /**
   * Formats a single FHIR resource by combining the resource data with its metadata.
   * @param resource - The FHIR resource document to format
   * @returns The formatted FHIR resource with combined metadata
   */
  static format(resource): object {
    
    return {
      ...resource.resource,
      meta: resource.meta,
    };
  }
  
  static notValid(result: ValidationResult): object {
    
    const response = {
      resourceType: 'OperationOutcome',
      issue: []
    }
    
    for(const error of result.errors){
      
      const issue = {
        severity: 'error',
        code: 'invalid',
        details: {
          text: error
        }
      } as never

      response.issue.push(issue)
    }
    
    return response
  }
  
  static notFound(description): object {
    
    return {
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        details: {
          text: `${description}`
        }
      }]
    }
  }
  
  static notAcceptatble(description): object{
    
    return {
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-accaptable',
        details: {
          text: `${description}`
        }
      }]
    };
  }
  
  /**
   * Creates a FHIR Bundle resource containing multiple FHIR resources with pagination support.
   * @param resources - Array of FHIR resource documents to include in the bundle
   * @param total - Total number of available resources
   * @param resourceType - The type of FHIR resources in the bundle
   * @param offset - Starting index for pagination (default: 0)
   * @param count - Number of resources per page (default: 20)
   * @returns A FHIR Bundle resource containing the requested resources and pagination links
   */
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
        }] : []),
      ],
      entry: resources.map(resource => ({
        fullUrl: `${resourceType}/${resource.id}`,
        resource: FhirResponse.format(resource),
        search: {
          mode: 'match',
        },
      })),
    };
  }
}
