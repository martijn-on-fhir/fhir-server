import { BadRequestException, ConflictException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { FhirResource, FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FhirResponse } from '../../lib/fhir-response';
import { DeleteOperation } from '../../lib/operations/delete-operation';
import { CreateOperation } from '../../lib/operations/create-operation';
import { UpdateOperation } from '../../lib/operations/update-operation';
import { SearchOperation } from '../../lib/operations/search-operation';
import { ValidationService } from '../validation/validation.service';
import { StructureDefinitionSchema, StructureDefinitionDocument } from '../../schema/structure-definition.schema';
import { Metadata } from '../../lib/metadata';

/**
 * Service for handling FHIR resources operations including CRUD and search functionality.
 * Implements FHIR REST API specifications for resource management with MongoDB storage.
 */
@Injectable()
export class FhirService {
  
  /**
   * @param fhirResourceModel
   * @param structureDefinitonModel
   * @param validationService
   */
  constructor(@InjectModel(FhirResource.name) private fhirResourceModel: Model<FhirResourceDocument>,
              @InjectModel(StructureDefinitionSchema.name) private structureDefinitonModel: Model<StructureDefinitionDocument>,
              private validationService: ValidationService) {
  }
  
  /**
   * Retrieve a specific FHIR resource by its type and ID.
   * @param resourceType - The FHIR resource type (e.g., 'Patient', 'Observation')
   * @param id - The unique identifier of the resource
   * @returns Promise containing the requested FHIR resource
   * @throws NotFoundException if the resource is not found
   */
  async findById(resourceType: string, id: string): Promise<any> {
    
    try {
      
      const operation = new SearchOperation(this.fhirResourceModel);
      return await operation.findById(resourceType, id);
      
    } catch (error) {
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Error retrieving ${resourceType}/${id}: ${error.message}`);
    }
  }
  
  /**
   * Search for FHIR resources based on type and search parameters.
   * Supports pagination, sorting, and filtering.
   * @param resourceType - The FHIR resource type to search for
   * @param searchParams - Search parameters including _count, _offset, _sort, and resource-specific filters
   * @returns Promise containing a FHIR Bundle with matching resources
   */
  async find(resourceType: string, searchParams: any): Promise<any> {
    
    try {
      
      const operation = new SearchOperation(this.fhirResourceModel);
      return operation.find(resourceType, searchParams);
      
    } catch (error) {
      throw new Error(`Error searching ${resourceType}: ${error.message}`);
    }
  }
  
  /**
   * Create a new FHIR resource.
   * @param resourceType - The type of FHIR resource to create
   * @param resourceData - The resource data to be stored
   * @returns Promise containing the created FHIR resource
   */
  async create(resourceType: string, resourceData: any): Promise<any> {
    
    await this.validationService.validateResource(resourceData);
    
    try {
      const operation = new CreateOperation(this.fhirResourceModel);
      return operation.execute(resourceType, resourceData);
    } catch (error: any) {
      
      if (error instanceof NotAcceptableException) {
        return FhirResponse.notAcceptatble(error.message);
      }
      
      throw new Error(`Error creating ${resourceType}: ${error.message}`);
    }
  }
  
  /**
   * Update an existing FHIR resource.
   * Implements versioning and optimistic locking.
   * @param resourceType - The type of FHIR resource to update
   * @param id - The unique identifier of the resource
   * @param resourceData - The updated resource data
   * @returns Promise containing the updated FHIR resource
   * @throws NotFoundException if resource doesn't exist
   * @throws ConflictException if version conflict occurs
   */
  async update(resourceType: string, id: string, resourceData: any): Promise<any> {
    
    await this.validationService.validateResource(resourceData);
    
    try {
      
      const operation = new UpdateOperation(this.fhirResourceModel);
      return operation.execute(resourceType, id, resourceData);
      
    } catch (error) {
      
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new Error(`Error updating ${resourceType}/${id}: ${error.message}`);
    }
  }
  
  /**
   * Soft delete a FHIR resource by marking it as inactive.
   * @param resourceType - The type of FHIR resource to delete
   * @param id - The unique identifier of the resource
   * @returns Promise containing OperationOutcome with deletion status
   * @throws NotFoundException if resource doesn't exist
   */
  async delete(resourceType: string, id: string): Promise<any> {
    
    try {
      
      const operation = new DeleteOperation(this.fhirResourceModel);
      return operation.execute(resourceType, id);
      
    } catch (error: any) {
      
      if (error instanceof NotFoundException) {
        return FhirResponse.notFound(error.message);
      }
      
      throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
    }
  }
  
  /**
   * Retrieves FHIR server metadata including capability statement and supported resource types.
   * Fetches distinct resource types from structure definitions and generates metadata response.
   * @returns Promise containing the FHIR server capability statement with supported resources and operations
   */
  public async getMetaData(): Promise<any> {
    
    const structures =  await this.structureDefinitonModel.distinct('resourceType').exec()
    return (new Metadata()).get(structures)
  }
  
  /**
   * Do some checks before processing the create or update process
   * @param method
   * @param resourceType
   * @param data
   * @param id
   */
  async checkPreRequest(method: 'POST' | 'PUT', resourceType: string, data: any, id?: string): Promise<void> {
    
    if (method === 'POST') {
      
      if(data?.resourceType !== resourceType){
        throw new BadRequestException(`ResourceType (${resourceType}) in the URL does not match the ResourceType in the request body (${data.resourceType})`)
      }
      
    } else if (method === 'PUT') {
      
      if (!id) {
        throw new BadRequestException('ID is required for PUT operation');
      }
      
      if(data?.id !== id){
        throw new BadRequestException(`ID in the URL (${id}) does not match the ID in the request body. (${data.id}`)
      }
      
      if(data?.resourceType !== resourceType){
        throw new BadRequestException(`ResourceType (${resourceType}) in the URL does not match the ResourceType in the request body (${data.resourceType})`)
      }
      
    } else {
      throw new BadRequestException(`Unsupported HTTP method: ${method}`);
    }
  }
}
