import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FhirResource, FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { FhirResponse } from '../../lib/fhir-response';


/**
 * Service for handling FHIR resources operations including CRUD and search functionality.
 * Implements FHIR REST API specifications for resource management with MongoDB storage.
 */
@Injectable()
export class FhirService {
  
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
      
      // Als resource niet gevonden
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
      // Haal resources op met pagination
      const resources = await this.fhirResourceModel
      .find(query)
      .skip(offset)
      .limit(count)
      .sort(sort)
      .exec();
      
      // Tel totaal aantal resources voor pagination info
      const total = await this.fhirResourceModel.countDocuments(query);
      
      // Return FHIR Bundle formaat
      return FhirResponse.bundle (resources, total, resourceType, offset, count);
      
    } catch (error) {
      throw new Error(`Error searching ${resourceType}: ${error.message}`);
    }
    
  }
  
  /**
   * Validates the input data for updating a FHIR resource.
   * @param resourceType - The type of FHIR resource being updated
   * @param id - The unique identifier of the resource
   * @param resourceData - The resource data to validate
   * @throws BadRequestException if resource data is invalid, missing, or inconsistent
   */
  private validateUpdateInput(resourceType: string, id: string, resourceData: any): void {
    // Controleer of resource data bestaat
    if (!resourceData || typeof resourceData !== 'object') {
      throw new BadRequestException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: {
            text: 'Resource data is required and must be an object',
          },
        }],
      });
    }
    
    // Controleer of resourceType consistent is
    if (resourceData.resourceType && resourceData.resourceType !== resourceType) {
      throw new BadRequestException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: {
            text: `Resource type mismatch. Expected ${resourceType}, got ${resourceData.resourceType}`,
          },
        }],
      });
    }
    
    // Controleer of ID consistent is
    if (resourceData.id && resourceData.id !== id) {
      throw new BadRequestException({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: {
            text: `Resource ID mismatch. Expected ${id}, got ${resourceData.id}`,
          },
        }],
      });
    }
  }
  
  /**
   * Create a new FHIR resource.
   * @param resourceType - The type of FHIR resource to create
   * @param resourceData - The resource data to be stored
   * @returns Promise containing the created FHIR resource
   */
  async create(resourceType: string, resourceData: any): Promise<any> {
    const id = resourceData.id || uuidv4();
    
    const fhirResource = new this.fhirResourceModel({
      resourceType,
      id,
      resource: {
        resourceType,
        id,
        ...resourceData,
      },
      meta: {
        versionId: '1',
        lastUpdated: new Date(),
      },
      searchParams: this.extractSearchParams(resourceType, resourceData),
    });
    
    const saved = await fhirResource.save();
    return FhirResponse.format(saved);
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
      // Valideer input
      this.validateUpdateInput(resourceType, id, resourceData);
      
      // Zoek bestaande resource
      const existingResource = await this.fhirResourceModel.findOne({
        resourceType,
        id,
        status: 'active',
      });
      
      if (!existingResource) {
        
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
      
      // Controleer optimistic locking (als versionId meegegeven wordt)
      if (resourceData.meta?.versionId && resourceData.meta.versionId !== existingResource.meta.versionId) {
        
        throw new ConflictException({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'conflict',
            details: {
              text: `Version conflict. Expected version ${existingResource.meta.versionId}, but received ${resourceData.meta.versionId}`,
            },
          }],
        });
      }
      
      // Bereid nieuwe resource data voor
      const newVersionId = String(parseInt(existingResource.meta.versionId) + 1);
      const updatedResourceData = this.prepareResourceForUpdate(
        resourceType,
        id,
        resourceData,
        existingResource,
        newVersionId,
      );
      
      // Extract search parameters voor nieuwe data
      const searchParams = this.extractSearchParams(resourceType, updatedResourceData);
      
      // Update de resource in database
      const updatedResource = await this.fhirResourceModel.findOneAndUpdate(
        { resourceType, id, status: 'active' },
        {
          $set: {
            resource: updatedResourceData,
            'meta.versionId': newVersionId,
            'meta.lastUpdated': new Date(),
            searchParams: searchParams,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      
      if (!updatedResource) {
        throw new Error('Failed to update resource');
      }
      
      return FhirResponse.format(updatedResource);
      
    } catch (error) {
      if (error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException) {
        throw error;
      }
      
      throw new Error(`Error updating ${resourceType}/${id}: ${error.message}`);
    }
    
  }
  
  private prepareResourceForUpdate(
    resourceType: string,
    id: string,
    resourceData: any,
    existingResource: FhirResourceDocument,
    newVersionId: string,
  ): any {
    // Behoud kritieke velden en voeg meta-informatie toe
    const updatedResource = {
      ...resourceData,
      resourceType,
      id,
      meta: {
        versionId: newVersionId,
        lastUpdated: new Date().toISOString(),
        // Behoud bestaande meta velden indien gewenst
        profile: resourceData.meta?.profile || existingResource.meta.profile || [],
        security: resourceData.meta?.security || existingResource.meta.security || [],
        tag: resourceData.meta?.tag || existingResource.meta.tag || [],
      },
    };
    
    return updatedResource;
  }
  
  
  // Soft delete - FHIR standaard approach (aanbevolen)
  /**
   * Soft delete a FHIR resource by marking it as inactive.
   * @param resourceType - The type of FHIR resource to delete
   * @param id - The unique identifier of the resource
   * @returns Promise containing OperationOutcome with deletion status
   * @throws NotFoundException if resource doesn't exist
   */
  async delete(resourceType: string, id: string): Promise<any> {
    
    
    try {
      // Eerst controleren of resource bestaat en actief is
      const existingResource = await this.fhirResourceModel.findOne({
        resourceType,
        id,
        status: 'active',
      });
      
      if (!existingResource) {
        
        throw new NotFoundException({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `${resourceType}/${id} not found or already deleted`,
            },
          }],
        });
      }
      
      // Update de resource status naar 'inactive' en verhoog versie
      const updatedResource = await this.fhirResourceModel.findOneAndUpdate(
        { resourceType, id, status: 'active' },
        {
          $set: {
            status: 'inactive',
            'meta.versionId': String(parseInt(existingResource.meta.versionId) + 1),
            'meta.lastUpdated': new Date(),
          },
          $push: {
            tags: 'deleted',
          },
        },
        { new: true },
      );
      
      if (!updatedResource) {
        throw new Error('Failed to delete resource');
      }
      
      
      // Return FHIR-compliant response
      return {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'information',
          code: 'deleted',
          details: {
            text: `${resourceType}/${id} has been deleted`,
          },
        }],
      };
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
    }
  }
  
  private extractSearchParams(resourceType: string, resource: any): Record<string, any> {
    const searchParams: Record<string, any> = {};
    
    // Generieke extractie van zoekparameters per resource type
    switch (resourceType) {
      case 'Patient':
        if (resource.name) searchParams.name = resource.name[0]?.family || resource.name[0]?.given?.join(' ');
        if (resource.gender) searchParams.gender = resource.gender;
        if (resource.birthDate) searchParams.birthdate = resource.birthDate;
        break;
      
      case 'Observation':
        if (resource.subject) searchParams.patient = resource.subject.reference;
        if (resource.code) searchParams.code = resource.code.coding?.[0]?.code;
        if (resource.effectiveDateTime) searchParams.date = resource.effectiveDateTime;
        break;
      
      // Voeg meer resource types toe
      default:
        // Basis search parameters
        if (resource.id) searchParams._id = resource.id;
        break;
    }
    
    return searchParams;
  }
  
  
  
}
