import { Injectable } from '@nestjs/common';
import { StructureDefinitionSchema, StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ValidationWarning } from '../../interfaces/validation-warning';
import { ValidationResult } from '../../interfaces/validation-result';
import { ValidationError } from '../../interfaces/validation-error';
import { StructureDefinition } from '../../interfaces/structure-definition';
import { ElementDefinition } from '../../interfaces/element-definition';
import * as fhirPath from 'fhirpath';
import { first } from 'lodash-es';
import  * as entity  from 'fhir/r4';

/**
 * Service responsible for validating FHIR resources against their structure definitions.
 * Provides functionality to ensure resources conform to FHIR specifications and profiles.
 */
@Injectable()
export class ValidationService {
  
  private resource: any;
  private structureDefinition: StructureDefinition;
  private elements: Map<string, ElementDefinition> = new Map();
  private slices: Map<string, ElementDefinition[]> = new Map();
  
  /**
   * Creates a new instance of the ValidationService
   * @param structureDefinitionModel - Injected Mongoose model for accessing FHIR StructureDefinitions
   */
  constructor(@InjectModel(StructureDefinitionSchema.name) private structureDefinitionModel: Model<StructureDefinitionDocument>) {
 
  }
  
  async validateResource(resource: any): Promise<ValidationResult> {
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const errors: ValidationError[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const warnings: ValidationWarning[] = [];
    const resourceType = resource.resourceType;
    this.resource = resource;
    
    if (!resourceType) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: 'Resource should contain a resourceType property',
          severity: 'error',
          code: 'required',
        }],
        warnings: [],
      };
    }
    
    this.structureDefinition = await this.getStructureDefinition(resourceType, this.resource?.profile).then((response) => {
      return response?.definition as StructureDefinition ?? null;
    });
    
    if (!this.structureDefinition) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: `No structure definition for resource type: ${resourceType}`,
          severity: 'error',
          code: 'unknown-resource-type',
        }],
        warnings: [],
      };
    }
    
    this.parseStructureDefinition();
    
    const validationResult = this.validate(this.resource);
    
    validationResult.errors.forEach(error => {
      
      // eslint-disable-next-line no-console
      console.log(`  - ${error.path}: ${error.message}`);
    });
    
    return validationResult;
  }
  
  private parseStructureDefinition(): void {
    
    this.structureDefinition.snapshot.element.forEach(element => {
      
      this.elements.set(element.path, element);
      
      // Handle slices
      if (element.sliceName) {
        
        const basePath = element.path;
        
        if (!this.slices.has(basePath)) {
          this.slices.set(basePath, []);
        }
        
        this.slices.get(basePath)!.push(element);
      }
    });
  }
  
  private validate(resource: any): ValidationResult {
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Validate resource type
      if (resource.resourceType !== this.structureDefinition.type) {
        errors.push({
          path: 'resourceType',
          severity: 'error',
          message: `Expected resourceType '${this.structureDefinition.type}', got '${resource.resourceType}'`,
        });
        return { isValid: false, errors, warnings };
      }
      
      // Validate profile declaration
      this.validateProfileDeclaration(resource, errors);
      
      // Validate all elements
      this.validateElement('Observation', resource, errors, warnings);
     
    } catch (error) {
      errors.push({
        path: 'root',
        severity: 'error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  private validateProfileDeclaration(resource: any, errors: ValidationError[]): void {
    if (!resource.meta?.profile?.includes(this.structureDefinition.url)) {
      errors.push({
        path: 'meta.profile',
        severity: 'error',
        message: `Resource must declare conformance to profile: ${this.structureDefinition.url}`,
      });
    }
  }
  
  /**
   * Retrieves the structure definition for a given resource type and optional profile
   * @param resourceType - The FHIR resource type to get structure definition for
   * @param profile - Optional profile URL(s) to find specific structure definition
   * @returns Promise resolving to structure definition document or null if not found
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
  
  private validateChildElements(path: string, value: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    
    if (!value || typeof value !== 'object') {
      return;
    }
    
    // Get all child element definitions
    const childElements = Array.from(this.elements.keys())
    .filter(elementPath => elementPath.startsWith(path + '.') &&
      elementPath.split('.').length === path.split('.').length + 1);
    
    childElements.forEach(childPath => {
      const childProperty = childPath.split('.').pop()!;
      const childValue = value[childProperty];
      
      if (Array.isArray(childValue)) {
        childValue.forEach((item) => {
          
          this.validateElement(childPath, item, errors, warnings);
        });
        
      } else {
        this.validateElement(childPath, childValue, errors, warnings);
      }
    });
  }
  
  private validateElement(path: string, value: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    
    const elementDef = this.elements.get(path);
    
    if (!elementDef) {
      return;
    }
    
    // Check cardinality
    this.validateCardinality(path, value, elementDef, errors);
    
    // Check data types
    this.validateDataType(path, value, elementDef, errors);
    
    // Check constraints
    this.validateConstraints(path, value, elementDef, errors, warnings);
    
    // Check patterns and fixed values
    this.validatePatterns(path, value, elementDef, errors);
    
    // Validate child elements
    this.validateChildElements(path, value, errors, warnings);
  }
  
  private validateCardinality(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    
    /**
     * Deze if moet gerefactored worden er wordt nog geen rekening gehouden met effectiveDate etc
     */
    if (value === undefined || value === null) {
      
      const base = elementDef?.base;
      const types = this.normalizeTypes(elementDef.type);
      
      if (path.endsWith('value[x]') && Array.isArray(types) && base) {
        
        types.forEach((type: {code: string, profile?: string[]}) => {
          
          const expression = path.replace('value[x]', `value${type.code}`).split('.').slice(1).join('.')
          const entities = fhirPath.evaluate(this.resource, expression, {})
          
          if(Array.isArray(entities) && entities.length >= 1){
            value = first(entities)
          }
        })
      }
      
      if (elementDef.min > 0 && !value) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Required element '${path}' is missing (min cardinality: ${elementDef.min})`,
        });
      }
      
      return;
    }
    
    if (Array.isArray(value)) {
      
      if (value.length < elementDef.min) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Element '${path}' has ${value.length} items, minimum required: ${elementDef.min}`,
        })
      }
      
      if (elementDef.max !== '*' && value.length > parseInt(elementDef.max)) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Element '${path}' has ${value.length} items, maximum allowed: ${elementDef.max}`,
        });
      }
    } else if (elementDef.max !== '*' && parseInt(elementDef.max) < 1) {
      
      errors.push({
        path,
        severity: 'error',
        message: `Element '${path}' should not be present (max cardinality: ${elementDef.max})`,
      });
    }
  }
  
  private validateDataType(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    if (!elementDef.type || value === undefined || value === null) return;
    
    // ???????????????????????
    // const expectedTypes = elementDef.type.map(t => t.code);
    
    // Basic type validation
    if (path.includes('valueQuantity') && !this.isValidQuantity(value)) {
      errors.push({
        path,
        severity: 'error',
        message: 'Invalid Quantity structure',
      });
    }
    
    if (path.includes('valueCodeableConcept') && !this.isValidCodeableConcept(value)) {
      errors.push({
        path,
        severity: 'error',
        message: 'Invalid CodeableConcept structure',
      });
    }
  }
  
  private isValidQuantity(value: any): boolean {
    return value &&
      typeof value === 'object' &&
      typeof value.value === 'number' &&
      typeof value.unit === 'string' &&
      typeof value.system === 'string' &&
      typeof value.code === 'string';
  }
  
  private evaluateConstraint(expression: string, value: any, path: string): boolean {
    // Simplified constraint evaluation - real implementation would use FHIRPath
    
    try {
      // Handle some common constraint patterns
      if (expression.includes('exists()')) {
        
        return value !== undefined && value !== null;
      }
      
      if (expression.includes('empty()')) {
        
        const result = fhirPath.evaluate(value, expression, {
          base: path,
        });
        const isError = Array.isArray(result) ? result[0] === true : Boolean(result);
        
        return isError;
        
      }
      
      if (expression.includes('.length()')) {
        const match = expression.match(/\.length\(\)\s*>=\s*(\d+)/);
        
        if (match && typeof value === 'string') {
          return value.length >= parseInt(match[1]);
        }
      }
      
      // Default to true for unhandled expressions
      return true;
      
    } catch {
      return true;
    }
  }
  
  private validateConstraints(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!elementDef.constraint) return;
    
    elementDef.constraint.forEach(constraint => {
      
      try {
        
        if (!value && elementDef.min === 0) {
          return;
        }
        
        // Simplified constraint validation - in a real implementation, you'd use FHIRPath
        const isValid = this.evaluateConstraint(constraint.expression, value, path);
        
        if (!isValid) {
          const validationItem = {
            path,
            message: constraint.human,
            constraint: constraint.key,
          };
          
          if (constraint.severity === 'error') {
            errors.push({ ...validationItem, severity: 'error' });
          } else {
            warnings.push(validationItem);
          }
        }
      } catch (error) {
        warnings.push({
          path,
          message: `Could not evaluate constraint ${constraint.key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    });
  }
  
  private validatePatterns(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    // Validate pattern constraints
    if (elementDef.patternCodeableConcept && value) {
      
      const isValid = this.matchesCodeableConceptPattern(value, elementDef.patternCodeableConcept);
      
      if (!isValid) {
        errors.push({
          path,
          severity: 'error',
          message: `Value does not match required pattern for ${path}`,
        });
      }
    }
    
    if (elementDef.patternQuantity && value) {
      
      const isValid = this.matchesQuantityPattern(value, elementDef.patternQuantity);
      
      if (!isValid) {
        errors.push({
          path,
          severity: 'error',
          message: `Quantity does not match required pattern for ${path}`,
        });
      }
    }
    
    if (elementDef.fixedUri && value !== elementDef.fixedUri) {
      
      errors.push({
        path,
        severity: 'error',
        message: `Expected fixed value '${elementDef.fixedUri}', got '${value}'`,
      });
    }
  }
  
  private isValidCodeableConcept(value: any): boolean {
    return value && typeof value === 'object' && (Array.isArray(value.coding) || typeof value.text === 'string');
  }
  
  private matchesCodeableConceptPattern(value: any, pattern: any): boolean {
    
    if (!pattern.coding || !value.coding) {
      return true;
    }
    
    return pattern.coding.every((patternCoding: any) =>
      value.coding.some((valueCoding: any) => {
        return valueCoding.system === patternCoding.system && valueCoding.code === patternCoding.code;
      }),
    );
  }
  
  private matchesQuantityPattern(value: any, pattern: any): boolean {
    
    return (!pattern.system || value.system === pattern.system) &&
      (!pattern.code || value.code === pattern.code);
  }
  
  /**
   * Not all types are niclely formatted, so let 's fix it
   * @param types
   * @private
   */
  private normalizeTypes(types: { code: string; profile?: string[] }[] | undefined): { code: string; profile?: string[] }[] | undefined {
    
    if (types) {
      return types.map(type => {
        return {
          code: type.code.charAt(0).toUpperCase() + type.code.slice(1),
          profile: type.profile,
        };
      });
    }
    
    return types
  }
}
