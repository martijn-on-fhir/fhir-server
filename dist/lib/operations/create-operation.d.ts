import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
export declare class CreateOperation extends Operation {
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    execute(resourceType: string, resourceData: any): Promise<any>;
}
