import { Operation } from './operation';
import { Model, SortOrder } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { SearchResult } from '../../interfaces/search-result';
import { SearchParameters } from '../../interfaces/search-parameters';
export declare class SearchOperation extends Operation {
    count: number;
    offset: number;
    sort: Record<string, SortOrder>;
    filter: any;
    includes: any[];
    revIncludes: any[];
    constructor(fhirResourceModel: Model<FhirResourceDocument>);
    findById(resourceType: string, id: string, searchParameters?: SearchParameters): Promise<any>;
    find(resourceType: string, searchParams: SearchParameters): Promise<SearchResult>;
    appendId(id: string): void;
    private appendIdentifier;
    private appendProfile;
    private transformToDotNotation;
}
