import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
export declare class UpdateOperation extends Operation {
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    execute(resourceType: string, id: string, resourceData: any): Promise<any>;
    private prepareResourceForUpdate;
}
