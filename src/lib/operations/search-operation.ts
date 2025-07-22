import { Operation } from './operation';
import { Model } from 'mongoose';
import { FhirResourceDocument } from '../../schema/fhir-resource-schema';
import { NotFoundException } from '@nestjs/common';
import { FhirResponse } from '../fhir-response';

export class SearchOperation extends Operation {
  
  constructor(fhirResourceModel: Model<FhirResourceDocument>) {
    
    super(fhirResourceModel);
    this.fhirResourceModel = fhirResourceModel;
  }
  
  async findById(resourceType: string, id: string): Promise<any>{
    
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
  }
  
  async find(resourceType: string, searchParams: any): Promise<any>{
    
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
    
    const resources = await this.fhirResourceModel
    .find(query)
    .skip(offset)
    .limit(count)
    .sort(sort)
    .exec();
    
    const total = await this.fhirResourceModel.countDocuments(query);
    
    return FhirResponse.bundle(resources, total, resourceType, offset, count);
  }
}
