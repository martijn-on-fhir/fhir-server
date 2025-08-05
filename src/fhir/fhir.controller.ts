import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FhirService } from '../services/fhir/fhir.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ValidationService } from '../services/validation/validation.service';
import { ValidationResult } from '../interfaces/validation-result';
import { AuthorizerGuard } from '../guards/authorizer/authorizer.guard';
import { CreateResourceDto } from '../dto/create-resource-dto'
import { UpdateResourceDto } from '../dto/update-resource-dto'
import { ValidateResourceDto } from '../dto/validate-resource-dto'
import { SearchResult } from '../interfaces/search-result'
import { SearchParameters } from '../interfaces/search-parameters'

@UseGuards(AuthorizerGuard)
@ApiTags('Fhir Server')
@Controller('fhir')
export class FhirController {
  
  constructor(private readonly _service: FhirService, private readonly _validatiobService: ValidationService) {
  }
  
  @ApiOperation({ summary: 'Get FHIR server capability statement', description: 'Returns the FHIR server metadata including supported resources and operations' })
  @Get('metadata')
  getCapabilityStatement(): any {
    return this._service.getMetaData()
  }
  
  @ApiOperation({ summary: 'Validate FHIR resource', description: 'Validates a FHIR resource against its structure definition' })
  @ApiResponse({ status: 200, description: 'Resource validation result' })
  @Post('$validate')
  async validate( @Body() resource: ValidateResourceDto): Promise<ValidationResult> {
    return await this._validatiobService.validateResource(resource);
  }
  
  @ApiOperation({ summary: 'Search FHIR resources', description: 'Search for FHIR resources of specific type with optional search parameters' })
  @ApiParam({ name: 'resourceType', description: 'Type of FHIR resource' })
  @Get(':resourceType')
  async searchResources(@Param('resourceType') resourceType: string, @Query() searchParams?: SearchParameters): Promise<SearchResult> {
    return await this._service.find(resourceType, searchParams ?? {});
  }
  
  @ApiOperation({ summary: 'Get FHIR resource by ID', description: 'Retrieve a specific FHIR resource by its type and ID' })
  @ApiParam({ name: 'resourceType', description: 'Type of FHIR resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @Get(':resourceType/:id')
  async getResource(@Param('resourceType') resourceType: string, @Param('id') id: string,
                    @Query() searchParams?: SearchParameters): Promise<any> {
    return await this._service.findById(resourceType, id, searchParams);
  }
  
  @ApiOperation({ summary: 'Create FHIR resource', description: 'Create a new FHIR resource' })
  @ApiParam({ name: 'resourceType', description: 'Type of FHIR resource' })
  @Post(':resourceType')
  async createResource(@Param('resourceType') resourceType: string, @Body() resource: CreateResourceDto): Promise<any> {
    
    await this._service.checkPreRequest('POST', resourceType, resource)
    return await this._service.create(resourceType, resource);
  }
  
  @ApiOperation({ summary: 'Update FHIR resource', description: 'Update an existing FHIR resource by its ID' })
  @ApiParam({ name: 'resourceType', description: 'Type of FHIR resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @Put(':resourceType/:id')
  async update(@Param('resourceType') resourceType: string, @Param('id') id: string, @Body() resource: UpdateResourceDto): Promise<any> {
    
    await this._service.checkPreRequest('POST', resourceType, resource, id)
    return await this._service.update(resourceType, id, resource)
  }
  
  @ApiOperation({ summary: 'Delete FHIR resource', description: 'Delete a FHIR resource by its ID' })
  @ApiParam({ name: 'resourceType', description: 'Type of FHIR resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @Delete(':resourceType/:id')
  delete(@Param('resourceType') resourceType: string, @Param('id') id: string): Promise<any> {
    
    return this._service.delete(resourceType, id);
  }
}
