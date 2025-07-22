import { BadRequestException, ConflictException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { FhirResource, FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { FhirResponse } from '../../lib/fhir-response';
import { DeleteOperation } from '../../lib/operations/delete-operation';
import { CreateOperation } from '../../lib/operations/create-operation';
import { UpdateOperation } from '../../lib/operations/update-operation';


/**
 * Service for handling FHIR resources operations including CRUD and search functionality.
 * Implements FHIR REST API specifications for resource management with MongoDB storage.
 */
@Injectable()
export class FhirService {
  
  /**
   *
   * @param fhirResourceModel
   */
  constructor(@InjectModel(FhirResource.name) private fhirResourceModel: Model<FhirResourceDocument>) {
  }
  
  
  /**
   * Retrieve a specific FHIR resource by its type and ID.
   * @param resourceType - The FHIR resource type (e.g., 'Patient', 'Observation')
   * @param id - The unique identifier of the resource
   * @returns Promise containing the requested FHIR resource
   * @throws NotFoundException if the resource is not found
   */
  async findById(resourceType: string, id: string) {
    
    try {
      
      const resource = await this.fhirResourceModel.findOne({
        resourceType, id, status: 'active',
      }).exec();
      
      if (!resource) {
        
        throw new NotFoundException({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `${resourceType}/${id} not found`,
            },
          }],
        });
      }
      
      return FhirResponse.format(resource);
      
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
  async find(resourceType: string, searchParams: any) {
    
    const query: any = {
      resourceType,
      status: 'active',
    };
    
    // Voeg search parameters toe als ze bestaan
    Object.keys(searchParams).forEach(key => {
      if (key === '_count') return;
      if (key === '_offset') return;
      if (key === '_sort') return;
      
      // Zoek in searchParams field
      query[`searchParams.${key}`] = searchParams[key];
    });
    
    // Pagination parameters
    const count = parseInt(searchParams._count) || 20;
    const offset = parseInt(searchParams._offset) || 0;
    
    // Sorting
    let sort: any = { 'meta.lastUpdated': -1 };
    if (searchParams._sort) {
      const sortField = searchParams._sort.startsWith('-')
        ? searchParams._sort.substring(1)
        : searchParams._sort;
      const sortOrder = searchParams._sort.startsWith('-') ? -1 : 1;
      sort = { [`searchParams.${sortField}`]: sortOrder };
    }
    
    try {
      
      const resources = await this.fhirResourceModel
      .find(query)
      .skip(offset)
      .limit(count)
      .sort(sort)
      .exec();
      
      const total = await this.fhirResourceModel.countDocuments(query);
      
      return FhirResponse.bundle(resources, total, resourceType, offset, count);
      
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
    
    try {
      const operation  = new CreateOperation(this.fhirResourceModel)
      return operation.execute(resourceType, resourceData);
    }
    catch(error: any){
      
      if(error instanceof NotAcceptableException){
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
  async update(resourceType: string, id: string, resourceData: any) {
    
    try {
      
      const operation = new UpdateOperation(this.fhirResourceModel)
      return operation.execute(resourceType, id, resourceData)
      
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
      
      const operation = new DeleteOperation(this.fhirResourceModel)
      return operation.execute(resourceType, id);
      
    } catch (error: any){
      
      if(error instanceof NotFoundException){
        return FhirResponse.notFound(error.message);
      }
      
      throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
    }
  }
}
