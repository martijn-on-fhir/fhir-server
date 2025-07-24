import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
export declare class SearchOperation extends Operation {
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    findById(resourceType: string, id: string): Promise<any>;
    find(resourceType: string, searchParams: any): Promise<any>;
}
