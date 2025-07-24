import { StructureDefinitionDocument } from '../../schema/structure-definition';
import { Model } from 'mongoose';
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
    code: string;
}
export interface ValidationWarning {
    path: string;
    message: string;
    code: string;
}
export declare class ValidationService {
    private structureDefinitionModel;
    skippedElements: string[];
    constructor(structureDefinitionModel: Model<StructureDefinitionDocument>);
    validateResource(resource: any): Promise<ValidationResult>;
    private getStructureDefinition;
    private validateAgainstStructureDefinition;
    private validateElement;
    private getValueByPath;
    private validateDataType;
    private isValidType;
    private isValidUri;
    private isValidUrl;
    private isValidDateTime;
    private isValidDate;
    validateResourceOrThrow(resource: any): Promise<void>;
    private getParentElementPath;
    private checkAnchestor;
}
