import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { v4 as uuidv4 } from 'uuid';
import { FhirResponse } from '../fhir-response';
import { NotAcceptableException } from '@nestjs/common';

export class CreateOperation extends Operation {
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  async execute(resourceType: string, resourceData: any): Promise<any> {
    
    const id = typeof resourceData.id === 'string' ? resourceData.id : uuidv4();
    const exsits = await this.exists(resourceType, id);
    
    if (!exsits) {
      
      resourceData.id = id
      
      const fhirResource = new this.fhirResourceModel({
        ...resourceData
      });
      
      const saved = await fhirResource.save();
      
      return FhirResponse.format(saved);
      
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
