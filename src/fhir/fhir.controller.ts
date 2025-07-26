import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { FhirService } from '../services/fhir/fhir.service';
import { ApiTags } from "@nestjs/swagger";
import { ValidationService } from '../services/validation/validation.service';
import { ValidationResult } from '../interfaces/validation-result';

@ApiTags('Fhir Server')
@Controller('fhir')
export class FhirController {
  
  constructor(private readonly _service: FhirService, private readonly _validatiobService: ValidationService) {
  }
  
  @Get('metadata')
  getCapabilityStatement(): any {
    return this._service.getMetaData()
  }
  
  @Post('$validate')
  async validate( @Body() resource: any): Promise<ValidationResult> {
    return this._validatiobService.validateResource(resource);
  }
  
  @Get(':resourceType')
  async searchResources(@Param('resourceType') resourceType: string, @Query() searchParams: any): Promise<any> {
    return this._service.find(resourceType, searchParams);
  }
  
  @Get(':resourceType/:id')
  async getResource(@Param('resourceType') resourceType: string, @Param('id') id: string): Promise<any> {
    return this._service.findById(resourceType, id);
  }
  
  @Post(':resourceType')
  async createResource(@Param('resourceType') resourceType: string, @Body() resource: any): Promise<any> {
    
    await this._service.checkPreRequest('POST', resourceType, resource)
    return this._service.create(resourceType, resource);
  }
  
  @Put(':resourceType/:id')
  async update(@Param('resourceType') resourceType: string, @Param('id') id: string, @Body() resource: any): Promise<any> {
    
    await this._service.checkPreRequest('POST', resourceType, resource, id)
    return this._service.update(resourceType, id, resource)
  }
  
  @Delete(':resourceType/:id')
  delete(@Param('resourceType') resourceType: string, @Param('id') id: string): Promise<any> {
    
    return this._service.delete(resourceType, id);
  }
}
