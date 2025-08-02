import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { ValidationService } from '../validation/validation.service';
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class FhirService {
    private fhirResourceModel;
    private structureDefinitonModel;
    private validationService;
    private eventEmitter;
    constructor(fhirResourceModel: Model<FhirResourceDocument>, structureDefinitonModel: Model<StructureDefinitionDocument>, validationService: ValidationService, eventEmitter: EventEmitter2);
    findById(resourceType: string, id: string): Promise<any>;
    find(resourceType: string, searchParams: any): Promise<any>;
    create(resourceType: string, resourceData: any): Promise<any>;
    update(resourceType: string, id: string, resourceData: any): Promise<any>;
    delete(resourceType: string, id: string): Promise<any>;
    getMetaData(): Promise<any>;
    checkPreRequest(method: 'POST' | 'PUT', resourceType: string, data: any, id?: string): Promise<void>;
}
