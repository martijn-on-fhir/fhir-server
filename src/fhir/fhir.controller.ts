import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { FhirService } from '../services/fhir/fhir.service';

@Controller('fhir')
export class FhirController {
  
  constructor(private readonly _service: FhirService) {
  }
  
  @Get('metadata')
  getCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      kind: 'instance',
      software: {
        name: 'Martijn on Fhir Server',
        version: '1.0.0',
      },
      implementation: {
        description: 'Generic FHIR Server built with NestJS and MongoDB',
      },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        resource: [
          { type: 'Patient', interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }] },
          { type: 'Observation', interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }] },
        ],
      }],
    };
  }
  
  @Get(':resourceType')
  async searchResources(@Param('resourceType') resourceType: string, @Query() searchParams: any) {
    return this._service.find(resourceType, searchParams);
  }
  
  @Get(':resourceType/:id')
  async getResource(@Param('resourceType') resourceType: string, @Param('id') id: string) {
    return this._service.findById(resourceType, id);
  }
  
  @Post(':resourceType')
  async createResource(@Param('resourceType') resourceType: string, @Body() resource: any) {
    return this._service.create(resourceType, resource);
  }
  
  @Put(':resourceType/:id')
  update(@Param('resourceType') resourceType: string, @Param('id') id: string, @Body() resource: any) {
    return this._service.update(resourceType, id, resource)
  }
  
  @Delete(':resourceType/:id')
  delete(@Param('resourceType') resourceType: string, @Param('id') id: string) {
    return this._service.delete(resourceType, id);
  }
  
}
