import { FhirService } from '../services/fhir/fhir.service';
export declare class FhirController {
    private readonly _service;
    constructor(_service: FhirService);
    getCapabilityStatement(): any;
    searchResources(resourceType: string, searchParams: any): Promise<any>;
    getResource(resourceType: string, id: string): Promise<any>;
    createResource(resourceType: string, resource: any): Promise<any>;
    update(resourceType: string, id: string, resource: any): Promise<any>;
    delete(resourceType: string, id: string): Promise<any>;
}
