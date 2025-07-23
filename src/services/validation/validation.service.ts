import { BadRequestException, Injectable } from '@nestjs/common';
import { StructureDefinition, StructureDefinitionDocument } from '../../schema/structure-definition';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { first } from 'lodash-es';

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

@Injectable()
export class ValidationService {
  
  constructor(@InjectModel(StructureDefinition.name) private structureDefinitionModel: Model<StructureDefinitionDocument>) {
  
  }
  
  /**
   * Valideer een FHIR resource tegen zijn structure definition
   */
  async validateResource(resource: any): Promise<ValidationResult> {
    
    const resourceType = resource.resourceType;
    
    if (!resourceType) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: 'Resource moet een resourceType bevatten',
          severity: 'error',
          code: 'required',
        }],
        warnings: [],
      };
    }
    
    // Haal de structure definition op voor dit resource type
    const structureDefinition = await this.getStructureDefinition(resourceType, resource?.profile);
    
    if (!structureDefinition) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: `Geen structure definition gevonden voor resource type: ${resourceType}`,
          severity: 'error',
          code: 'unknown-resource-type',
        }],
        warnings: [],
      };
    }
    
    // Valideer de resource tegen de structure definition
    return this.validateAgainstStructureDefinition(resource, structureDefinition);
  }
  
  /**
   * Haal structure definition op voor een resource type
   */
  private async getStructureDefinition(resourceType: string, profile?: string[]): Promise<StructureDefinitionDocument | null> {
    
    const filter = {
      resourceType: resourceType,
    };
    
    if (profile) {
      
      Object.assign(filter, {
        url: Array.isArray(profile) ? first(profile) : profile,
      });
    }
    
    return this.structureDefinitionModel.findOne(filter).exec();
  }
  
  /**
   * Valideer resource tegen structure definition
   */
  private validateAgainstStructureDefinition(resource: any, structureDefinition: StructureDefinitionDocument): ValidationResult {
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      
      const definition = structureDefinition.definition;
      
      if (!definition || !definition.snapshot || !definition.snapshot.element) {
        throw new Error('Ongeldige structure definition format');
      }
      
      const elements = definition.snapshot.element;
      
      // Valideer elk element uit de structure definition
      for (const element of elements) {
        
        const elementPath = element.path;
        const elementDefinition = element;
        //
        // if(elementPath.startsWith('Patient.extension')){
        //   const dummmy = null
        //   return {
        //     isValid: true,
        //     errors: [],
        //     warnings: []
        //   }
        // }
        
        this.validateElement(resource, elementPath, elementDefinition, errors)
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
      
    } catch (error) {
      
      return {
        isValid: false,
        errors: [{
          path: 'root',
          message: `Validatie fout: ${error.message}`,
          severity: 'error',
          code: 'validation-error',
        }],
        warnings,
      };
    }
  }
  
  /**
   * Valideer een specifiek element
   */
  private validateElement(resource: any, elementPath: string, elementDefinition: any, errors: ValidationError[]): void {
    
    const pathParts = elementPath.split('.');
    // const resourceType = pathParts[0];
    
    // Skip root resource type element
    if (pathParts.length === 1) {
      return;
    }
    
    const fieldPath = pathParts.slice(1).join('.');
    const value = this.getValueByPath(resource, fieldPath);
    
    // Check required fields (min cardinality > 0)
    if (elementDefinition.min && elementDefinition.min > 0) {
      
      if (value === undefined || value === null) {
        
        errors.push({
          path: fieldPath,
          message: `Verplicht veld '${fieldPath}' ontbreekt`,
          severity: 'error',
          code: 'required',
        });
        
        return;
      }
    }
    
    // Check if value exists but shouldn't (max cardinality = 0)
    if (elementDefinition.max === '0' && value !== undefined) {
      
      errors.push({
        path: fieldPath,
        message: `Veld '${fieldPath}' is niet toegestaan`,
        severity: 'error',
        code: 'forbidden',
      });
      
      return;
    }
    
    // Skip further validation if value doesn't exist
    if (value === undefined || value === null) {
      return;
    }
    
    // Check cardinality (max)
    if (elementDefinition.max && elementDefinition.max !== '*') {
      
      const maxCount = parseInt(elementDefinition.max);
      
      if (Array.isArray(value) && value.length > maxCount) {
        
        errors.push({
          path: fieldPath,
          message: `Te veel waarden voor '${fieldPath}'. Maximum: ${maxCount}, gevonden: ${value.length}`,
          severity: 'error',
          code: 'cardinality',
        });
      }
    }
    
    // Check data type validation
    if (elementDefinition.type && elementDefinition.type.length > 0) {
      
      const validType = this.validateDataType(value, elementDefinition.type, fieldPath);
      
      if (!validType.isValid) {
        
        errors.push({
          path: fieldPath,
          message: validType.message,
          severity: 'error',
          code: 'type-mismatch',
        });
      }
    }
    
    // Check fixed values
    if (elementDefinition.fixedString && value !== elementDefinition.fixedString) {
      
      errors.push({
        path: fieldPath,
        message: `Veld '${fieldPath}' moet de waarde '${elementDefinition.fixedString}' hebben`,
        severity: 'error',
        code: 'fixed-value',
      });
    }
    
    // Check pattern validation
    if (elementDefinition.patternString && typeof value === 'string') {
      
      const pattern = new RegExp(elementDefinition.patternString);
      
      if (!pattern.test(value)) {
        errors.push({
          path: fieldPath,
          message: `Veld '${fieldPath}' voldoet niet aan het verwachte patroon`,
          severity: 'error',
          code: 'pattern',
        });
      }
    }
  }
  
  /**
   * Haal waarde op basis van pad (bijv. "patient.name.family")
   */
  private getValueByPath(object: any, path: string): any {
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, object);
  }
  
  /**
   * Valideer data type
   */
  private validateDataType(value: any, types: any[], fieldPath: string): { isValid: boolean, message: string } {
    
    const typeNames = types.map(t => t.code);
    
    for (const typeName of typeNames) {
      if (this.isValidType(value, typeName)) {
        return { isValid: true, message: '' };
      }
    }
    
    return {
      isValid: false,
      message: `Veld '${fieldPath}' heeft een ongeldig type. Verwacht: ${typeNames.join(' of ')}`,
    };
  }
  
  /**
   * Check of waarde geldig is voor specifiek FHIR type
   */
  private isValidType(value: any, typeName: string): boolean {
    switch (typeName) {
      case 'string':
      case 'http://hl7.org/fhirpath/System.String':
        return typeof value === 'string';
      case 'boolean':
        return typeof value === 'boolean';
      case 'integer':
        return Number.isInteger(value);
      case 'decimal':
        return typeof value === 'number';
      case 'uri':
        return typeof value === 'string' && this.isValidUri(value);
      case 'url':
        return typeof value === 'string' && this.isValidUrl(value);
      case 'code':
        return typeof value === 'string' && value.length > 0;
      case 'id':
        return typeof value === 'string' && /^[A-Za-z0-9\-.]{1,64}$/.test(value);
      case 'dateTime':
        return typeof value === 'string' && this.isValidDateTime(value);
      case 'date':
        return typeof value === 'string' && this.isValidDate(value);
      case 'BackboneElement':
      case 'Element':
        return typeof value === 'object' && value !== null;
      default:
        // Voor complexe types of onbekende types, accepteer object
        return typeof value === 'object' && value !== null;
    }
  }
  
  private isValidUri(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return /^[a-zA-Z][a-zA-Z0-9+.-]*:.+/.test(value);
    }
  }
  
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  
  private isValidDateTime(value: string): boolean {
    const dateTimeRegex = /^\d{4}(-\d{2}(-\d{2}(T\d{2}(:\d{2}(:\d{2}(\.\d+)?)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
    return dateTimeRegex.test(value);
  }
  
  private isValidDate(value: string): boolean {
    const dateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
    return dateRegex.test(value);
  }
  
  /**
   * Valideer en gooi exception bij fouten
   */
  async validateResourceOrThrow(resource: any): Promise<void> {
    
    const result = await this.validateResource(resource);
    
    if (!result.isValid) {
      
      result.errors.map(error => `${error.path}: ${error.message}`);
      
      throw new BadRequestException({
        message: 'Resource validatie gefaald',
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }
}
