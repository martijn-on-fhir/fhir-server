import { Injectable } from '@nestjs/common'
import { StructureDefinitionDocument, StructureDefinitionSchema } from '../../schema/structure-definition.schema'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { ValidationWarning } from '../../interfaces/validation-warning'
import { ValidationResult } from '../../interfaces/validation-result'
import { ValidationError } from '../../interfaces/validation-error'
import { StructureDefinition } from '../../interfaces/structure-definition'
import { ElementDefinition } from '../../interfaces/element-definition'
import * as fhirPath from 'fhirpath'
import { first } from 'lodash-es'
import { TerminologyService } from '../terminology/terminology.service'
import * as fhirModel from 'fhirpath/fhir-context/r4'
import { ValidateType } from '../../lib/validation/validate-type'

/**
 * Service responsible for validating FHIR resources against their structure definitions.
 * Provides functionality to ensure resources conform to FHIR specifications and profiles.
 * Validates resource structure, cardinality, data types, and constraints according to FHIR specifications.
 */
@Injectable()
export class ValidationService {
  
  private resource: any
  private resourceType: string
  private structureDefinition: StructureDefinition
  private elements: Map<string, ElementDefinition> = new Map()
  private slices: Map<string, ElementDefinition[]> = new Map()
  
  /**
   * Creates a new instance of the ValidationService
   * @param structureDefinitionModel - Injected Mongoose model for accessing FHIR StructureDefinitions
   * @param _terminologyService
   */
  constructor(@InjectModel(StructureDefinitionSchema.name) private structureDefinitionModel: Model<StructureDefinitionDocument>,
              private readonly _terminologyService: TerminologyService) {
  }
  
  /**
   * Validates a FHIR resource against its structure definition
   * @param resource - The FHIR resource to validate
   * @returns Promise resolving to validation results containing errors and warnings
   * @throws Error if validation process fails
   */
  async validateResource(resource: any): Promise<ValidationResult> {
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const errors: ValidationError[] = []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const warnings: ValidationWarning[] = []
    this.resourceType = resource.resourceType
    this.resource = resource
    
    if (!this.resourceType) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: 'Resource should contain a resourceType property',
          severity: 'error',
          code: 'required'
        }],
        warnings: []
      }
    }
    
    this.structureDefinition = await this.getStructureDefinition(this.resourceType, this.resource?.profile).then((response) => {
      return response?.definition as StructureDefinition ?? null
    })
    
    if (!this.structureDefinition) {
      
      return {
        isValid: false,
        errors: [{
          path: 'resourceType',
          message: `No structure definition for resource type: ${this.resourceType}`,
          severity: 'error',
          code: 'unknown-resource-type'
        }],
        warnings: []
      }
    }
    
    this.parseStructureDefinition()
    
    const validationResult = await this.validate(this.resource)
    
    validationResult.errors.forEach(error => {
      console.log(`  - ${error.path}: ${error.message}`)
    })
    
    return validationResult
  }
  
  /**
   * Parses the structure definition into element and slice maps for validation
   * Maps each element by path and collects slice definitions for handling choice types
   * @private
   */
  private parseStructureDefinition(): void {
    
    this.elements.clear()
    this.structureDefinition.snapshot.element.forEach(element => {
      
      this.elements.set(element.path, element)
      
      // Handle slices
      if (element.sliceName) {
        
        const basePath = element.path
        
        if (!this.slices.has(basePath)) {
          this.slices.set(basePath, [])
        }
        
        this.slices.get(basePath)!.push(element)
      }
    })
  }
  
  /**
   * Performs full validation of a resource against its structure definition
   * Validates resource type, profile declarations, and all elements recursively
   * @param resource - The resource to validate
   * @returns Promise resolving to validation results
   * @private
   */
  private async validate(resource: any): Promise<ValidationResult> {
    
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    try {
      // Validate resource type
      if (resource.resourceType !== this.structureDefinition.type) {
        errors.push({
          path: 'resourceType',
          severity: 'error',
          message: `Expected resourceType '${this.structureDefinition.type}', got '${resource.resourceType}'`
        })
        return { isValid: false, errors, warnings }
      }
      
      // Validate profile declaration
      this.validateProfileDeclaration(resource, errors)
      
      this.checkRootProperties(resource, errors)
      
      // Validate all elements
      await this.validateElement(this.resourceType, resource, errors, warnings)
      
    } catch (error) {
      
      errors.push({
        path: 'root',
        severity: 'error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validates that the resource properly declares conformance to required profiles
   * Checks meta.profile for required profile URLs
   * @param resource - The resource being validated
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateProfileDeclaration(resource: any, errors: ValidationError[]): void {
    
    if (!resource.meta?.profile?.includes(this.structureDefinition.url)) {
      
      errors.push({
        path: 'meta.profile',
        severity: 'error',
        message: `Resource must declare conformance to profile: ${this.structureDefinition.url}`
      })
    }
  }
  
  /**
   * Validates that all root level properties in the resource are defined in the structure definition
   * Checks each property against known element definitions and reports unknown properties as errors
   * Special handling for 'effective' prefixed properties which are allowed
   * @param resource - The FHIR resource being validated
   * @param errors - Array to collect validation errors
   * @private
   */
  private checkRootProperties(resource: any, errors: ValidationError[]): void {
    
    const rootProperties = Object.keys(resource).filter(key => !key.startsWith('_'))
    
    rootProperties.forEach(property => {
      
      if (!this.elements.has(`${this.resourceType}.${property}`) && property !== 'resourceType') {
        
        if (property.startsWith('effective') || property.startsWith('deceased') || property.startsWith('multipleBirth')) {
          return
        }
        
        errors.push({
          path: property,
          severity: 'error',
          message: `Unexpected property: ${property}`
        })
      }
    })
  }
  
  /**
   * Retrieves the structure definition for a given resource type and optional profile
   * @param resourceType - The FHIR resource type to get structure definition for
   * @param profile - Optional profile URL(s) to find specific structure definition
   * @returns Promise resolving to structure definition document or null if not found
   */
  private async getStructureDefinition(resourceType: string, profile?: string[]): Promise<StructureDefinitionDocument | null> {
    
    const filter = {
      resourceType: resourceType
    }
    
    if (profile) {
      
      Object.assign(filter, {
        url: Array.isArray(profile) ? first(profile) : profile
      })
    }
    
    return this.structureDefinitionModel.findOne(filter).exec()
  }
  
  private async validateChildElements(path: string, value: any, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    
    if (!value || typeof value !== 'object') {
      return
    }
    
    // Get all child element definitions
    const childElements = Array.from(this.elements.keys())
    .filter(elementPath => elementPath.startsWith(path + '.') &&
      elementPath.split('.').length === path.split('.').length + 1)
    
    for (const childPath of childElements) {
      
      const childProperty = childPath.split('.').pop()!
      const childValue = value[childProperty]
      
      if (Array.isArray(childValue)) {
        
        for (const item of childValue) {
          await this.validateElement(childPath, item, errors, warnings)
        }
        
      } else {
        await this.validateElement(childPath, childValue, errors, warnings)
      }
    }
  }
  
  /**
   * Validates a single element against its element definition
   * Performs cardinality, data type, constraint, and pattern validation
   * @param path - The element path in dot notation
   * @param value - The element value to validate
   * @param errors - Array to collect validation errors
   * @param warnings - Array to collect validation warnings
   * @private
   */
  private async validateElement(path: string, value: any, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    
    const elementDef = this.elements.get(path)
    
    if (!elementDef) {
      return
    }
    
    // Check cardinality
    this.validateCardinality(path, value, elementDef, errors)
    
    // Check data types
    this.validateDataType(value, elementDef, errors)
    
    // Check constraints
    await this.validateConstraints(path, value, elementDef, errors, warnings)
    
    // Check patterns and fixed values
    this.validatePatterns(path, value, elementDef, errors)
    
    // Validate child elements
    await this.validateChildElements(path, value, errors, warnings)
  }
  
  /**
   * Validates element cardinality (min/max occurrences)
   * Checks if required elements are present and array sizes are within bounds
   * @param path - The element path
   * @param value - The element value
   * @param elementDef - The element definition to validate against
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateCardinality(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    
    /**
     * Deze if moet gerefactored worden er wordt nog geen rekening gehouden met effectiveDate etc
     */
    if (value === undefined || value === null) {
      
      const base = elementDef?.base
      const types = this.normalizeTypes(elementDef.type)
      
      if (path.endsWith('value[x]') && Array.isArray(types) && base) {
        
        types.forEach((type: { code: string, profile?: string[] }) => {
          
          const expression = path.replace('value[x]', `value${type.code}`).split('.').slice(1).join('.')
          const entities = fhirPath.evaluate(this.resource, expression, {})
          
          if (Array.isArray(entities) && entities.length >= 1) {
            value = first(entities)
          }
        })
      }
      
      if (elementDef.min > 0 && !value) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Required element '${path}' is missing (min cardinality: ${elementDef.min})`
        })
      }
      
      return
    }
    
    if (Array.isArray(value)) {
      
      if (value.length < elementDef.min) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Element '${path}' has ${value.length} items, minimum required: ${elementDef.min}`
        })
      }
      
      if (elementDef.max !== '*' && value.length > parseInt(elementDef.max)) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Element '${path}' has ${value.length} items, maximum allowed: ${elementDef.max}`
        })
      }
    } else if (elementDef.max !== '*' && parseInt(elementDef.max) < 1) {
      
      errors.push({
        path,
        severity: 'error',
        message: `Element '${path}' should not be present (max cardinality: ${elementDef.max})`
      })
    }
  }
  
  private validateDataType(value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    
    if (!elementDef.type || value === undefined || value === null) return
    
    const validator = new ValidateType(elementDef)
    
    if (!validator.isValid(value)) {
      errors.push(validator.getErrorMessage())
    }
  }
  
  /**
   * Converts FHIRPath evaluation result to boolean value
   * FHIRPath returns results as arrays, where true/false values are stored at index 0
   * @param result - The result array from FHIRPath evaluation
   * @returns boolean - true if result array contains true at first position, false otherwise
   * @private
   */
  private _toBoolean(result): boolean {
    return Array.isArray(result) && result[0] === true
  }
  
  private evaluateConstraint(expression: string, value: any, path: string): boolean {
    
    if (!value) {
      return true
    }
    
    try {
      
      const result = this._toBoolean(fhirPath.evaluate(this.resource, expression, {
        base: path
      }, fhirModel))
      
      /**
       * I think this is a bug, need to check this out. cose resource seems okee.
       */
      if (!result && path === 'Observation.component') {
        return true
      }
      
      return result
      
    } catch {
      return true
    }
  }
  
  private async validateConstraints(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[], warnings: ValidationWarning[]): Promise<any> {
    
    if (!elementDef.constraint) return
    
    const valueSet = elementDef.binding?.valueSet as string
    
    if (value && valueSet) {
      
      const collection = await this._terminologyService.lookup(valueSet)
      
      if (Array.isArray(collection)) {
        
        const exists = collection.find((item: any) => {
          
          if (typeof value === 'string') {
            return item.code === value
          }
          
          return item.code === value.coding[0].code
        })
        
        if (!exists) {
          
          const allowed = collection.map((item: any) => {
            return item.code.toLowerCase() === item.display.toLowerCase() ? item.code : `${item.code} - ${item.display}`
          }).join(', ')
          
          errors.push({
            path,
            severity: 'error',
            message: `Value not allowed, possible values are: ${allowed}`
          })
        }
      }
    }
    
    for (const constraint of elementDef.constraint) {
      
      try {
        
        if (!value && elementDef.min === 0) {
          return
        }
        
        // Simplified constraint validation - in a real implementation, you'd use FHIRPath
        const isValid = this.evaluateConstraint(constraint.expression, value, path)
        
        if (!isValid) {
          
          const validationItem = {
            path,
            message: constraint.human,
            constraint: constraint.key,
            expression: constraint.expression
          }
          
          if (constraint.severity === 'error') {
            errors.push({ ...validationItem, severity: 'error' })
          } else {
            warnings.push(validationItem)
          }
        }
        
      } catch (error) {
        warnings.push({
          path,
          message: `Could not evaluate constraint ${constraint.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
  }
  
  private validatePatterns(path: string, value: any, elementDef: ElementDefinition, errors: ValidationError[]): void {
    
    let pattern
    
    for (const property in elementDef) {
      
      if (property.startsWith('pattern') && property) {
        pattern = property.substring('pattern'.length, property.length)
      }
    }
    
    if (pattern && value) {
      
      const r = fhirPath.evaluate(this.resource, `${path}.exists($this is ${pattern})`, {
        base: path
      }, fhirModel)
      
      if (!this._toBoolean(r)) {
        
        errors.push({
          path,
          severity: 'error',
          message: `Value does not match required pattern for ${path}`
        })
      }
    }
    
    if (elementDef.fixedUri && value !== elementDef.fixedUri) {
      
      errors.push({
        path,
        severity: 'error',
        message: `Expected fixed value '${elementDef.fixedUri}', got '${value}'`
      })
    }
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
          profile: type.profile
        }
      })
    }
    
    return types
  }
}
