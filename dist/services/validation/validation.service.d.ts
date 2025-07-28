import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { Model } from 'mongoose';
import { ValidationResult } from '../../interfaces/validation-result';
export declare class ValidationService {
    private structureDefinitionModel;
    private resource;
    private structureDefinition;
    private elements;
    private slices;
    constructor(structureDefinitionModel: Model<StructureDefinitionDocument>);
    validateResource(resource: any): Promise<ValidationResult>;
    private parseStructureDefinition;
    private validate;
    private validateProfileDeclaration;
    private getStructureDefinition;
    private validateChildElements;
    private validateElement;
    private validateCardinality;
    private validateDataType;
    private isValidQuantity;
    private evaluateConstraint;
    private validateConstraints;
    private validatePatterns;
    private isValidCodeableConcept;
    private matchesCodeableConceptPattern;
    private matchesQuantityPattern;
    private normalizeTypes;
}
