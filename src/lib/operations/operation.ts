import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';

/**
 * Base class for FHIR resource operations.
 * Provides common functionality for all FHIR operations including resource existence checks.
 */
export class Operation {
  
  fhirResourceModel: Model<FhirResourceDocument>;
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    this.fhirResourceModel = fhirResourceModel;
  }
  
  /**
   * Checks if a FHIR resource exists in the database.
   * @param resourceType - The type of FHIR resource to check
   * @param id - The unique identifier of the resource
   * @returns The resource document if found, null otherwise
   */
  async exists(resourceType: string, id: string): Promise<any> {
    
    const exists = await  this.fhirResourceModel.findOne({
      resourceType,
      id
    });
    
    return exists;
  }
}
