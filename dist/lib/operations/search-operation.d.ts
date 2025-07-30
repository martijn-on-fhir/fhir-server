import { Operation } from './operation';
import { Model, SortOrder } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
export declare class SearchOperation extends Operation {
    count: number;
    offset: number;
    sort: Record<string, SortOrder>;
    filter: any;
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    findById(resourceType: string, id: string): Promise<any>;
    find(resourceType: string, searchParams: any): Promise<any>;
    appendId(id: string): void;
    private appendIdentifier;
    private transformToDotNotation;
}
