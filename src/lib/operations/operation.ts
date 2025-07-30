import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';

export class Operation {
  
  fhirResourceModel: Model<FhirResourceDocument>;
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    this.fhirResourceModel = fhirResourceModel;
  }
  
  async exists(resourceType: string, id: string): Promise<any> {
    
    const exists = await  this.fhirResourceModel.findOne({
      resourceType,
      id,
      'resource.active': true,
    });
    
    return exists;
  }
}
