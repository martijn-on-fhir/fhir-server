import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FhirResponse } from '../fhir-response';

export class UpdateOperation extends Operation {
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  async execute(resourceType: string, id: string, resourceData: any) {
    
    const entity = await this.exists(resourceType, id);
    
    if(entity){
      
      if (resourceData.meta?.versionId && resourceData.meta.versionId !== entity.meta.versionId) {
        
        throw new ConflictException({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'conflict',
            details: {
              text: `Version conflict. Expected version ${entity.meta.versionId}, but received ${resourceData.meta.versionId}`,
            },
          }],
        });
      }
      
      const newVersionId = String(parseInt(entity.meta.versionId) + 1);
      const updatedResourceData = this.prepareResourceForUpdate( resourceType, id, resourceData, entity, newVersionId)
      
      const searchParams = this.extractSearchParams(resourceType, updatedResourceData);
      const updatedResource = await this.fhirResourceModel.findOneAndUpdate(
        { resourceType, id, status: 'active' },
        {
          $set: {
            resource: updatedResourceData,
            'meta.versionId': newVersionId,
            'meta.lastUpdated': new Date(),
            searchParams: searchParams,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
      
      if (!updatedResource) {
        throw new Error('Failed to update resource');
      }
      
      return FhirResponse.format(updatedResource);
      
    } else {
      
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: `${resourceType}/${id} can not be updated, cos it does not exists`,
          }
        }]
      })
    }
  }
  
  /**
   * Prepares a FHIR resource for update by merging new data with existing metadata.
   * @param resourceType - The type of FHIR resource being updated
   * @param id - The unique identifier of the resource
   * @param resourceData - The new resource data to be applied
   * @param existingResource - The current version of the resource in the database
   * @param newVersionId - The new version identifier to be assigned
   * @returns The prepared resource object with merged metadata
   */
  private prepareResourceForUpdate(resourceType: string, id: string, resourceData: any, existingResource: FhirResourceDocument, newVersionId: string): any {
    
    return {
      ...resourceData,
      resourceType,
      id,
      meta: {
        versionId: newVersionId,
        lastUpdated: new Date().toISOString(),
        profile: resourceData.meta?.profile || existingResource.meta.profile || [],
        security: resourceData.meta?.security || existingResource.meta.security || [],
        tag: resourceData.meta?.tag || existingResource.meta.tag || [],
      },
    };
  }
}
