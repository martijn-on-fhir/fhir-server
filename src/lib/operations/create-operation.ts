import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { v4 as uuidv4 } from 'uuid';
import { FhirResponse } from '../fhir-response';
import { NotAcceptableException } from '@nestjs/common';

/**
 * Implements FHIR Create operation to store new resources in the database.
 * Extends the base Operation class to provide create functionality.
 */
export class CreateOperation extends Operation {

    /**
     * Creates an instance of CreateOperation.
     * @param fhirResourceModel - Mongoose model for FHIR resources
     */
    constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }

    /**
     * Executes the create operation for a FHIR resource.
     * @param resourceType - The type of FHIR resource being created
     * @param resourceData - The resource data to be stored
     * @returns Promise resolving to the created FHIR resource
     * @throws NotAcceptableException when resource with provided ID already exists
     */
    async execute(resourceType: string, resourceData: any): Promise<any> {
    
    const id = typeof resourceData.id === 'string' ? resourceData.id : uuidv4();
    const exsits = await this.exists(resourceType, id);
    
    if (!exsits) {
      
      resourceData.id = id
      
      const fhirResource = new this.fhirResourceModel({
        ...resourceData
      });
      
      const saved = await fhirResource.save();
      
      return FhirResponse.format(saved.toObject());
      
    } else {
      
      throw new NotAcceptableException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'Resource already exists',
          details: {
            text: `${resourceType}/${id} already deleted`,
          },
        }],
      });
    }
  }
}
