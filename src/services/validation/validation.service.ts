import { Injectable } from '@nestjs/common';
import { StructureDefinitionSchema, StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { first } from 'lodash-es';
import { ValidationWarning } from '../../interfaces/validation-warning';
import { ValidationResult } from '../../interfaces/validation-result';
import { ValidationError } from '../../interfaces/validation-error';

/**
 * Service responsible for validating FHIR resources against their structure definitions.
 * Provides functionality to ensure resources conform to FHIR specifications and profiles.
 */
@Injectable()
export class ValidationService {
  
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
    
    const dummy: ValidationResult = {} as ValidationResult
    return dummy
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
}
