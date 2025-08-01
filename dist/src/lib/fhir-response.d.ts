import { FhirResourceDocument } from '../schema/fhir-resource-schema';
import { ValidationResult } from '../interfaces/validation-result';
export declare class FhirResponse {
    static format(resource: any): object;
    static notValid(result: ValidationResult): object;
    static notFound(description: any): object;
    static notAcceptatble(description: any): object;
    static bundle(resources: FhirResourceDocument[], total: number, resourceType: string, offset?: number, count?: number): any;
}
