import { StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { Model } from 'mongoose';
import { ValidationResult } from '../../interfaces/validation-result';
import { TerminologyService } from '../terminology/terminology.service';
export declare class ValidationService {
    private structureDefinitionModel;
    private readonly _terminologyService;
    private resource;
    private resourceType;
    private structureDefinition;
    private elements;
    private slices;
    constructor(structureDefinitionModel: Model<StructureDefinitionDocument>, _terminologyService: TerminologyService);
    validateResource(resource: any): Promise<ValidationResult>;
    private parseStructureDefinition;
    private validate;
    private validateProfileDeclaration;
    private checkRootProperties;
    private getStructureDefinition;
    private validateChildElements;
    private validateElement;
    private validateCardinality;
    private validateDataType;
    private _toBoolean;
    private evaluateConstraint;
    private validateConstraints;
    private validatePatterns;
    private normalizeTypes;
}
