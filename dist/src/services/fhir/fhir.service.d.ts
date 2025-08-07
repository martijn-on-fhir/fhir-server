import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { ValidationService } from '../validation/validation.service';
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SearchResult } from '../../interfaces/search-result';
import { SearchParameters } from '../../interfaces/search-parameters';
import { Request } from 'express';
export declare class FhirService {
    private readonly request;
    private fhirResourceModel;
    private structureDefinitonModel;
    private validationService;
    private eventEmitter;
    constructor(request: Request, fhirResourceModel: Model<FhirResourceDocument>, structureDefinitonModel: Model<StructureDefinitionDocument>, validationService: ValidationService, eventEmitter: EventEmitter2);
    findById(resourceType: string, id: string, searchParams?: SearchParameters): Promise<any>;
    find(resourceType: string, searchParams: SearchParameters): Promise<SearchResult>;
    create(resourceType: string, resourceData: any): Promise<any>;
    update(resourceType: string, id: string, resourceData: any): Promise<any>;
    delete(resourceType: string, id: string): Promise<any>;
    getMetaData(): Promise<any>;
    checkPreRequest(method: 'POST' | 'PUT', resourceType: string, data: any, id?: string): Promise<void>;
}
