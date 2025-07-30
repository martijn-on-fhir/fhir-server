import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { NotFoundException } from '@nestjs/common';
import { Operation } from './operation';

/**
 * Handles deletion operations for FHIR resources using soft delete strategy.
 * Instead of physically removing records, it marks them as 'inactive' and adds a 'deleted' tag,
 * preserving the resource history while making it inaccessible through normal queries.
 */
export class DeleteOperation extends Operation {
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  /**
   * Executes a soft delete operation on a FHIR resource.
   * @param resourceType - The type of FHIR resource (e.g., 'Patient', 'Observation')
   * @param id - The unique identifier of the resource
   * @returns Promise resolving to an OperationOutcome indicating success or failure
   * @throws NotFoundException when resource doesn't exist or is already deleted
   * @throws Error for other operational failures
   */
  async execute(resourceType: string, id: string): Promise<any> {
    
    try {
      
      const entity: any = await this.exists(resourceType, id);
      
      if (!entity) {
        
        throw new NotFoundException({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `${resourceType}/${id} not found or already deleted`,
            },
          }],
        });
      }
      
      const updatedResource = await this.updateResource(resourceType, id, entity);
      
      if (!updatedResource) {
        throw new Error('Failed to delete resource');
      }
      
      return {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'information',
          code: 'deleted',
          details: {
            text: `${resourceType}/${id} has been deleted`,
          },
        }],
      };
      
    } catch (error) {
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
    }
  }
  
  /**
   * Updates the resource status to implement soft delete.
   * Marks the resource as 'inactive', increments version, updates timestamp and adds 'deleted' tag.
   * @param resourceType - The type of FHIR resource
   * @param id - The unique identifier of the resource
   * @param entity - The existing resource entity
   * @returns Promise resolving to the updated resource or null if update fails
   */
  private async updateResource(resourceType: string, id: string, entity: any): Promise<any> {
    
    return this.fhirResourceModel.findOneAndUpdate(
      { resourceType, id },
      {
        $set: {
          status: 'inactive',
          'resource.meta.versionId': String(parseInt(entity.meta?.versionId ?? 0) + 1),
          'resource.meta.lastUpdated': new Date(),
        },
        $push: {
          tags: 'deleted',
        },
      },
      { new: true },
    )
  }
}
