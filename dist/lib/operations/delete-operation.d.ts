import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Operation } from './operation';
export declare class DeleteOperation extends Operation {
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    execute(resourceType: string, id: string): Promise<any>;
    private updateResource;
}
