import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { ValidationService } from '../validation/validation.service';
import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
export declare class FhirService {
    private fhirResourceModel;
    private structureDefinitonModel;
    private validationService;
    constructor(fhirResourceModel: Model<FhirResourceDocument>, structureDefinitonModel: Model<StructureDefinitionDocument>, validationService: ValidationService);
    findById(resourceType: string, id: string): Promise<any>;
    find(resourceType: string, searchParams: any): Promise<any>;
    create(resourceType: string, resourceData: any): Promise<any>;
    update(resourceType: string, id: string, resourceData: any): Promise<any>;
    delete(resourceType: string, id: string): Promise<any>;
    getMetaData(): Promise<any>;
    checkPreRequest(method: 'POST' | 'PUT', resourceType: string, data: any, id?: string): Promise<void>;
}
