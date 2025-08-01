import { ValidationError } from '../../interfaces/validation-error';
export declare class ValidateType {
    private readonly elementDef;
    value: any;
    expectedTypes: string[];
    error: ValidationError;
    path: string;
    message: string;
    constructor(elementDef: any);
    isValid(value: any): boolean;
    private isValidMeta;
    private isValidNarrative;
    private isValidExtension;
    private isValidReference;
    private isValidIdentifier;
    private isValidCode;
    private isValidString;
    private isValidCodeableConcept;
    private isValidBackboneElement;
    private isValidCoding;
    private isValidInstant;
    private isValidAnnotation;
    private isValidMarkdown;
    getErrorMessage(): ValidationError;
    normalize(label: string): string;
}
