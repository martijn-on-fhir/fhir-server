import { FhirResourceDocument } from '../schema/fhir-resource-schema';
import { v4 as uuidv4 } from 'uuid';
import { ValidationResult } from '../interfaces/validation-result'
import { Request } from 'express';

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
      ...resource
    };
  }
  
  /**
   * Creates an OperationOutcome resource for invalid FHIR resources.
   * @param result - The validation result containing errors
   * @returns An OperationOutcome resource describing validation errors
   */
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
  
  /**
   * Creates an OperationOutcome resource for resource not found errors.
   * @param description - Description of the resource that was not found
   * @returns An OperationOutcome resource with not-found error details
   */
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
  
  /**
   * Creates an OperationOutcome resource for not acceptable errors.
   * @param description - Description of why the request was not acceptable
   * @returns An OperationOutcome resource with not-acceptable error details
   */
  static notAcceptable(description): object {
    
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
   * @param request
   * @returns A FHIR Bundle resource containing the requested resources and pagination links
   */
  static bundle(resources: FhirResourceDocument[], total: number, resourceType: string, offset: number = 0, count: number = 20, request?: Request): any {
    
    let hostUrl = ''
    
    if(request){
      hostUrl = request.get('secure') ?  `https://${request.get('host')}` : `http://${request.get('host')}`
    }
    
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
        fullUrl: `${hostUrl}/${resource.resourceType}/${resource.id}`,
        resource: FhirResponse.format(resource),
        search: {
          mode: 'match',
        },
      })),
    };
  }
}
