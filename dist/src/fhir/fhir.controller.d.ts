import { FhirService } from '../services/fhir/fhir.service';
import { ValidationService } from '../services/validation/validation.service';
import { ValidationResult } from '../interfaces/validation-result';
export declare class FhirController {
    private readonly _service;
    private readonly _validatiobService;
    constructor(_service: FhirService, _validatiobService: ValidationService);
    getCapabilityStatement(): any;
    validate(resource: any): Promise<ValidationResult>;
    searchResources(resourceType: string, searchParams: any): Promise<any>;
    getResource(resourceType: string, id: string): Promise<any>;
    createResource(resourceType: string, resource: any): Promise<any>;
    update(resourceType: string, id: string, resource: any): Promise<any>;
    delete(resourceType: string, id: string): Promise<any>;
}
