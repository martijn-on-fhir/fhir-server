import { Operation } from './operation';
import { Model, SortOrder } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { SearchResult } from '../../interfaces/search-result';
export declare class SearchOperation extends Operation {
    count: number;
    offset: number;
    sort: Record<string, SortOrder>;
    filter: any;
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    findById(resourceType: string, id: string): Promise<any>;
    find(resourceType: string, searchParams: any): Promise<SearchResult>;
    appendId(id: string): void;
    private appendIdentifier;
    private appendProfile;
    private transformToDotNotation;
}
