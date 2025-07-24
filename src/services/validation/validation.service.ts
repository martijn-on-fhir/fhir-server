import { BadRequestException, Injectable } from '@nestjs/common';
import { StructureDefinition, StructureDefinitionDocument } from '../../schema/structure-definition';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { first, get } from 'lodash-es';

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

/**
 * Service responsible for validating FHIR resources against their structure definitions.
 * Provides functionality to ensure resources conform to FHIR specifications and profiles.
 */
@Injectable()
export class ValidationService {
  
  /**
   * When the parent element is not required and has no value, there's no need to validate its child elements.
   * For example: Patient.link is not required, so if it's empty, we don't need to validate Patient.link.url
   * (which would be required if Patient.link had a value).
   */
  /**
   * Tracks element paths that were skipped during validation because their parent element
   * was optional and had no value. This prevents unnecessary validation of child elements
   * when the parent context is empty.
   */
  skippedElements: string[] = [];
  
  /**
   * Creates a new instance of the ValidationService
   * @param structureDefinitionModel - Injected Mongoose model for accessing FHIR StructureDefinitions
   */
  constructor(@InjectModel(StructureDefinition.name) private structureDefinitionModel: Model<StructureDefinitionDocument>) {
  
  }
  
  /**
   * Validates a FHIR resource against its structure definition
   * @param resource - The FHIR resource to validate
   * @returns ValidationResult containing validation status, errors and warnings
   * @throws BadRequestException if validation fails
   *
   * The validation process includes:
   * 1. Checking for required resourceType
   * 2. Loading appropriate structure definition
   * 3. Validating resource structure and content
   */
  async validateResource(resource: any): Promise<ValidationResult> {
    
    const resourceType = resource.resourceType;
    
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
    
    const structureDefinition = await this.getStructureDefinition(resourceType, resource?.profile);
    
    if (!structureDefinition) {
      
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
    
    return this.validateAgainstStructureDefinition(resource, structureDefinition);
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
  
  /**
   * Valideer resource tegen structure definition
   */
  private validateAgainstStructureDefinition(resource: any, structureDefinition: StructureDefinitionDocument): ValidationResult {
    
    this.skippedElements = []
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      
      const definition = structureDefinition.definition;
      
      if (!definition || !definition.snapshot || !definition.snapshot.element) {
        throw new Error('Illegal structure definition format');
      }
      
      const elements = definition.snapshot.element;
      
      // Valideer elk element uit de structure definition
      for (const elementDefinition of elements) {
        
        const elementPath = elementDefinition.path;
        this.validateElement(resource, elementPath, elementDefinition, errors);
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
          message: `Validatie errer: ${error.message}`,
          severity: 'error',
          code: 'validation-error',
        }],
        warnings,
      };
    }
  }
  
  /**
   * Validates a single element of a FHIR resource against its structure definition
   * @param resource - The FHIR resource being validated
   * @param elementPath - Dot-notation path to the element (e.g. "Patient.name.family")
   * @param elementDefinition - Structure definition element containing validation rules
   * @param errors - Array to collect validation errors
   *
   * Performs the following validations:
   * - Required fields (min cardinality > 0)
   * - Forbidden fields (max cardinality = 0)
   * - Maximum cardinality constraints
   * - Data type validation
   * - Fixed value validation
   * - Pattern validation for strings
   */
  private validateElement(resource: any, elementPath: string, elementDefinition: any, errors: ValidationError[]): void {
    
    const pathParts = elementPath.split('.');
    
    // Skip root resource type element
    if (pathParts.length === 1) {
      return;
    }
    
    const parentElementPath = this.getParentElementPath(elementPath);
    
    if (parentElementPath && this.checkAnchestor(elementPath)) {
      return;
    }
    
    const fieldPath = pathParts.slice(1).join('.');
    const value = this.getValueByPath(resource, fieldPath);
    
    // Check required fields (min cardinality > 0)
    if (elementDefinition.min && elementDefinition.min > 0) {
      
      if (value === undefined || value === null) {
        
        errors.push({
          path: fieldPath,
          message: `Required property '${fieldPath}' is missing`,
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
        message: `property '${fieldPath}' is not allowed`,
        severity: 'error',
        code: 'forbidden',
      });
      
      return;
    }
    
    // Skip further validation if value doesn't exist
    if (value === undefined || value === null) {
      
      if (elementDefinition.min === 0) {
        
        if (this.skippedElements.indexOf(elementPath) === -1) {
          this.skippedElements.push(elementPath);
        }
      }
      
      return;
    }
    
    // Check cardinality (max)
    if (elementDefinition.max && elementDefinition.max !== '*') {
      
      const maxCount = parseInt(elementDefinition.max);
      
      if (Array.isArray(value) && value.length > maxCount) {
        
        errors.push({
          path: fieldPath,
          message: `To many values for '${fieldPath}'. Maximum: ${maxCount}, found: ${value.length}`,
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
        message: `property '${fieldPath}' must have the value of '${elementDefinition.fixedString}'`,
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
          message: `Property '${fieldPath}' does not match the expected pattern`,
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
    
    const value = path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, object);
    
    // const p = get(object, 'qualification[0].code')
    
    return value
  }
  
  /**
   * Validates that a value matches one of the allowed FHIR data types
   * @param value - The value to validate
   * @param types - Array of allowed FHIR type definitions
   * @param fieldPath - Path to the field being validated (for error messages)
   * @returns Object containing validation result and error message
   *
   * Checks if the value matches any of the allowed FHIR data types specified
   * in the types array. Returns isValid=true if at least one type matches,
   * otherwise returns isValid=false with an error message.
   */
  private validateDataType(value: any, types: any[], fieldPath: string): { isValid: boolean, message: string } {
    
    const typeNames = types.map(t => t.code);
    
    for (const typeName of typeNames) {
      
      if (Array.isArray(value)) {
        
        value.forEach((v: any) => {
          
          if (!this.isValidType(v, typeName)) {
            return { isValid: false, message: 'Not each entry of this given array matches the requested type' };
          }
        });
        
        return { isValid: true, message: '' };
      }
      
      if (this.isValidType(value, typeName)) {
        return { isValid: true, message: '' };
      }
    }
    
    return {
      isValid: false,
      message: `Property '${fieldPath}' has an invalid type. Expected: ${typeNames.join(' or ')}`,
    };
  }
  
  /**
   * Validates if a value matches a specified FHIR data type
   * @param value - The value to validate
   * @param typeName - The FHIR data type name to validate against
   * @returns boolean indicating if the value matches the specified type
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
  
  /**
   * Validates if a string is a valid URI according to FHIR specifications
   * @param value - The string to validate as URI
   * @returns boolean indicating if the string is a valid URI
   *
   * First attempts to parse as URL, then falls back to URI pattern validation
   * that matches scheme:path format where scheme starts with a letter
   */
  private isValidUri(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return /^[a-zA-Z][a-zA-Z0-9+.-]*:.+/.test(value);
    }
  }
  
  /**
   * Validates if a string is a valid URL
   * @param value - The string to validate as URL
   * @returns boolean indicating if the string is a valid URL
   *
   * Uses URL constructor to validate string matches URL format.
   * Must include protocol and host components to be valid.
   */
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Validates if a string matches FHIR dateTime format
   * @param value - The string to validate as dateTime
   * @returns boolean indicating if the string is a valid FHIR dateTime
   *
   * Validates format: YYYY[-MM[-DD[THH[:mm[:ss[.SSS]]][Z|±HH:mm]]]]
   * Where parts in [] are optional
   */
  private isValidDateTime(value: string): boolean {
    const dateTimeRegex = /^\d{4}(-\d{2}(-\d{2}(T\d{2}(:\d{2}(:\d{2}(\.\d+)?)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
    return dateTimeRegex.test(value);
  }
  
  /**
   * Validates if a string matches FHIR date format
   * @param value - The string to validate as date
   * @returns boolean indicating if the string is a valid FHIR date
   *
   * Validates format: YYYY[-MM[-DD]]
   * Where month and day components are optional
   */
  private isValidDate(value: string): boolean {
    const dateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
    return dateRegex.test(value);
  }
  
  /**
   * Validates a FHIR resource and throws an exception if validation fails
   * @param resource - The FHIR resource to validate
   * @throws BadRequestException with validation errors if resource is invalid
   * @returns Promise that resolves when validation passes
   *
   * This method provides a convenient way to validate resources where invalid
   * data should trigger an exception rather than returning validation results.
   * The thrown exception includes detailed validation errors and warnings.
   */
  async validateResourceOrThrow(resource: any): Promise<void> {
    
    const result = await this.validateResource(resource);
    
    if (!result.isValid) {
      
      result.errors.map(error => `${error.path}: ${error.message}`);
      
      throw new BadRequestException({
        message: 'Resource validation failed',
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }
  
  /**
   * Gets the parent element path by removing the last segment from a dot-separated path
   * @param elementPath - The full element path (e.g. "Patient.name.family")
   * @returns The parent element path or null if no parent exists (e.g. "Patient.name" or null)
   *
   * For paths with more than 2 segments, returns all but the last segment joined by dots.
   * For paths with 2 or fewer segments (e.g. "Patient" or "Patient.name"), returns null
   * since these represent root or direct child elements.
   */
  private getParentElementPath(elementPath: string): string | null {
    
    const parts = elementPath.split('.');
    
    if (parts.length <= 2) {
      return null;
    } else {
      return parts.slice(0, -1).join('.');
    }
  }
  
  /**
   * If a parent element or its ancestor is optional (min=0) and has no value, we can skip validation for its child elements.
   * For example: if Patient.link (min=0) is empty, we can skip validating Patient.link.url since the parent context is empty.
   *
   * @param elementPath - The element path to check for skipped validation
   * @private
   */
  private checkAnchestor(elementPath: string): boolean {
    
    const parentElementPath = this.getParentElementPath(elementPath);
    
    if (parentElementPath && this.skippedElements.indexOf(parentElementPath) !== -1) {
      return true;
    }
    
    if (parentElementPath) {
      
      const grandChestor = this.getParentElementPath(parentElementPath);
      
      if (grandChestor && this.skippedElements.indexOf(grandChestor)) {
        return true;
      }
    }
    
    return false;
  }
}
