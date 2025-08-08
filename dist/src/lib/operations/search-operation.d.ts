import { Operation } from './operation';
import { Model, SortOrder } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { SearchResult } from '../../interfaces/search-result';
import { SearchParameters } from '../../interfaces/search-parameters';
import { Request } from 'express';
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
export declare class SearchOperation extends Operation {
    private readonly structureDefinitonModel;
    count: number;
    offset: number;
    sort: Record<string, SortOrder>;
    filter: any;
    includes: any[];
    revIncludes: any[];
    request: Request;
    constructor(fhirResourceModel: Model<FhirResourceDocument>, request: Request, structureDefinitonModel: Model<StructureDefinitionDocument>);
    findById(resourceType: string, id: string, searchParameters?: SearchParameters): Promise<any>;
    find(resourceType: string, searchParams: SearchParameters): Promise<SearchResult>;
    appendId(id: string): void;
    private appendIdentifier;
    private appendProfile;
    private transformToDotNotation;
}
