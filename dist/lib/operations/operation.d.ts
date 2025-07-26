import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
export declare class Operation {
    fhirResourceModel: Model<FhirResourceDocument>;
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    exists(resourceType: string, id: string): Promise<any>;
    extractSearchParams(resourceType: string, resource: any): Record<string, any>;
}
