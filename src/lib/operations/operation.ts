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
      status: 'active',
    });
    
    return exists;
  }
  
   extractSearchParams(resourceType: string, resource: any): Record<string, any> {
    
    const searchParams: Record<string, any> = {};
     
     // Generieke extractie van zoekparameters per resource type
     switch (resourceType) {
       case 'Patient':
         if (resource.name) searchParams.name = resource.name[0]?.family || resource.name[0]?.given?.join(' ');
         if (resource.gender) searchParams.gender = resource.gender;
         if (resource.birthDate) searchParams.birthdate = resource.birthDate;
         break;
       
       case 'Observation':
         if (resource.subject) searchParams.patient = resource.subject.reference;
         if (resource.code) searchParams.code = resource.code.coding?.[0]?.code;
         if (resource.effectiveDateTime) searchParams.date = resource.effectiveDateTime;
         break;
       
       // Voeg meer resource types toe
       default:
         // Basis search parameters
         if (resource.id) searchParams._id = resource.id;
         break;
     }
     
     return searchParams
   }
}
