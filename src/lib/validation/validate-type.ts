import { ValidationError } from '../../interfaces/validation-error'

export class ValidateType {
  
  /** The value being validated */
  value: any
  expectedTypes: string[] = []
  error: ValidationError
  path: string
  message: string
  
  /**
   * Creates a new instance of ValidateType
   * @param elementDef - The element definition containing type information and path
   */
  constructor(private readonly elementDef: any) {
    
    elementDef.type?.map(type => {
      this.expectedTypes.push(this.normalize(type.code))
    })
    
    this.path = elementDef.path ?? 'Unkown'
  }
  
  /**
   * Validates if the given value matches any of the expected types
   * @param value - The value to validate
   * @returns true if the value is valid for any of the expected types, false otherwise
   */
  isValid(value: any): boolean {
    
    if(value === null || value === undefined) {
      return true
    }
    
    const errors: string[] = []
    
    for (const type of this.expectedTypes) {
      
      if (typeof this[`isValid${type}`] === 'function') {
        const valid = this[`isValid${type}`](value)
        
        if (valid !== true) {
          errors.push(type)
        }
      } else {
        console.log(`Missing type validation: ${type}`)
      }
    }
    
    return Array.isArray(errors) && errors.length === 0
  }
  
  /**
   * Validates if the value is a valid Meta type
   * @param value - The value to validate
   * @returns true if the value is a valid Meta object
   */
  private isValidMeta(value): boolean {
    return typeof value === 'object' && Array.isArray(value.profile)
  }
  
  /**
   * Validates if the value is a valid Narrative type
   * @param value - The value to validate
   * @returns true if the value is a valid Narrative object with status and div properties
   */
  private isValidNarrative(value): boolean {
    
    return  typeof value === 'object' &&
            typeof value.status === 'string' &&
            typeof value.div === 'string'
  }
  
  /**
   * Validates if the value is a valid Extension type
   * @param value - The value to validate
   * @returns true if the value is a valid Extension object with url property
   */
  private isValidExtension(value): boolean {
    return typeof value === 'object' && typeof value.url === 'string'
  }
  
  /**
   * Validates if the value is a valid Reference type
   * @param value - The value to validate
   * @returns true if the value is an object
   */
  private isValidReference(value): boolean {
    return typeof value === 'object'
  }
  
  /**
   * Validates if the value is a valid Identifier type
   * @param value - The value to validate
   * @returns true if the value is an object with system property
   */
  private isValidIdentifier(value): boolean {
    return typeof value === 'object' && typeof value.system === 'string'
  }
  
  /**
   * Validates if the value is a valid Code type
   * @param value - The value to validate
   * @returns true if the value is a non-empty string
   */
  private isValidCode(value): boolean {
    return typeof value === 'string'  && value.length > 0
  }
  
  /**
   * Validates if the value is a valid String type
   * @param value - The value to validate
   * @returns true if the value is a non-empty string
   */
  private isValidString(value): boolean {
    return typeof value === 'string' && value.length > 0
  }
  
  /**
   * Validates if the value is a valid CodeableConcept type
   * @param value - The value to validate
   * @returns true if the value has coding array or text property
   */
  private isValidCodeableConcept(value): boolean {
    return value && typeof value === 'object' && (Array.isArray(value.coding) || typeof value.text === 'string')
  }
  
  /**
   * Validates if the value is a valid BackboneElement type
   * @param value - The value to validate
   * @returns true if the value is an object
   */
  private isValidBackboneElement(value): boolean {
    return typeof value === 'object'
  }
  
  /**
   * Validates if the value is a valid Coding type
   * @param value - The value to validate
   * @returns true if the value has system and code properties
   */
  private isValidCoding(value): boolean {
    return typeof value === 'object' && typeof value.system === 'string' && typeof value.code === 'string'
  }
  
  /**
   * Validates if the value is a valid Instant type
   * @param value - The value to validate
   * @returns true if the value matches ISO 8601 datetime format
   */
  private isValidInstant(value: any): boolean {
    
    if(typeof value !== 'string') {
      return false
    }
    
    const patetrn = /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2}))?)?)?$/
    return Array.isArray(value.match(patetrn))
  }
  
  /**
   * Validates if the value is a valid Annotation type
   * @param value - The value to validate
   * @returns true if the value is an object with text property
   */
  private isValidAnnotation(value: any): boolean {
    return typeof value === 'object' && typeof value.text === 'string'
  }
  
  /**
   * Validates if the value is a valid Markdown type
   * @param value - The value to validate
   * @returns true if the value is a string
   */
  private isValidMarkdown(value: any): boolean {
    return typeof value === 'string'
  }
  
  /**
   * Gets the validation error message
   * @returns ValidationError object containing path, message and severity
   */
  getErrorMessage(): ValidationError {
    
    return {
      path: this.path,
      message: `Invalid type for ${this.elementDef.path}. Expected ${this.expectedTypes.join(', ')}.`,
      severity: 'error'
    }
  }
  
  /**
   * Normalizes a type label by converting URL-like strings to capitalized type names
   * @param label - The label to normalize
   * @returns Normalized string with first letter capitalized
   */
  normalize(label: string): string {
    
    if (label.startsWith('http')) {
      
      const parts = label.split('.')
      const lastPart = parts.length > 1 ? parts[parts.length - 1] : label
      
      return this.normalize(lastPart)
      
    } else {
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
  }
}
