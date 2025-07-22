import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { NotFoundException } from '@nestjs/common';
import { FhirResponse } from '../fhir-response';

export class SearchOperation extends Operation {
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  async findById(resourceType: string, id: string): Promise<any>{
    
    const resource = await this.fhirResourceModel.findOne({
      resourceType, id, status: 'active',
    }).exec();
    
    if (!resource) {
      
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: `${resourceType}/${id} not found`,
          },
        }],
      });
    }
    
    return FhirResponse.format(resource);
  }
  
  find(){
  
  }
}
