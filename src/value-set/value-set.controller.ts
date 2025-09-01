import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizerGuard } from '../guards/authorizer/authorizer.guard';
import { ValueSetService } from '../services/value-set/value-set.service';
import { CreateValueSetDto } from '../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../dto/update-value-set-dto';
import { ValueSetStatus } from '../schema/value-set.schema';

/**
 * Controller for managing FHIR ValueSet resources.
 * Handles CRUD operations, expansion, and code validation for ValueSets.
 */
@UseGuards(AuthorizerGuard)
@ApiTags('ValueSets')
@Controller('value-set')
export class ValueSetController {

  constructor(private readonly valueSetService: ValueSetService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new FHIR ValueSet',
    description: 'Creates a new ValueSet resource that defines a set of codes from one or more code systems'
  })
  @ApiResponse({
    status: 201,
    description: 'ValueSet created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
        name: 'AdministrativeGender',
        title: 'Administrative Gender',
        status: 'active',
        resourceType: 'ValueSet',
        meta: {
          versionId: '1',
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid ValueSet data or URL already exists' })
  create(@Body() createDto: CreateValueSetDto): Promise<any> {
    return this.valueSetService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Search ValueSet resources',
    description: 'Retrieves ValueSet resources with optional filtering by various parameters'
  })
  @ApiQuery({
    name: 'status',
    enum: ValueSetStatus,
    required: false,
    description: 'Filter by ValueSet status'
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    description: 'Filter by ValueSet name (partial match)'
  })
  @ApiQuery({
    name: 'url',
    type: String,
    required: false,
    description: 'Filter by canonical URL (partial match)'
  })
  @ApiQuery({
    name: 'publisher',
    type: String,
    required: false,
    description: 'Filter by publisher name'
  })
  @ApiResponse({
    status: 200,
    description: 'List of ValueSet resources',
    schema: {
      type: 'array',
      items: { type: 'object' }
    }
  })
  findAll(
    @Query('status') status?: ValueSetStatus,
    @Query('name') name?: string,
    @Query('url') url?: string,
    @Query('publisher') publisher?: string
  ): Promise<any[]> {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (name) {
      const sanitizedName = this.escapeRegexCharacters(name);
      filter.name = new RegExp(sanitizedName, 'i');
    }

    if (url) {
      const sanitizedUrl = this.escapeRegexCharacters(url);
      filter.url = new RegExp(sanitizedUrl, 'i');
    }

    if (publisher) {
      const sanitizedPublisher = this.escapeRegexCharacters(publisher);
      filter.publisher = new RegExp(sanitizedPublisher, 'i');
    }

    return this.valueSetService.findAll(filter);
  }

  @Get('by-status/:status')
  @ApiOperation({
    summary: 'Get ValueSets by status',
    description: 'Retrieves all ValueSet resources with the specified status'
  })
  @ApiParam({
    name: 'status',
    enum: ValueSetStatus,
    description: 'ValueSet status to filter by'
  })
  @ApiResponse({
    status: 200,
    description: 'List of ValueSet resources with the specified status'
  })
  findByStatus(@Param('status') status: ValueSetStatus): Promise<any[]> {
    return this.valueSetService.findByStatus(status);
  }

  @Get('by-url')
  @ApiOperation({
    summary: 'Get ValueSet by canonical URL',
    description: 'Retrieves a ValueSet resource by its canonical URL identifier'
  })
  @ApiQuery({
    name: 'url',
    type: String,
    required: true,
    description: 'Canonical URL of the ValueSet',
    example: 'http://hl7.org/fhir/ValueSet/administrative-gender'
  })
  @ApiResponse({
    status: 200,
    description: 'ValueSet resource'
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  findByUrl(@Query('url') url: string): Promise<any> {
    return this.valueSetService.findByUrl(url);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get ValueSet by ID',
    description: 'Retrieves a specific ValueSet resource by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the ValueSet',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'ValueSet resource'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ValueSet ID'
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  findOne(@Param('id') id: string): Promise<any> {
    return this.valueSetService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update ValueSet',
    description: 'Updates an existing ValueSet resource with new data'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the ValueSet to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'ValueSet updated successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ValueSet data or ID'
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateValueSetDto): Promise<any> {
    return this.valueSetService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete ValueSet',
    description: 'Permanently deletes a ValueSet resource'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the ValueSet to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'ValueSet deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.valueSetService.delete(id);
  }

  @Get(':id/$expand')
  @ApiOperation({
    summary: 'Expand ValueSet',
    description: 'Returns the full expansion of a ValueSet with all included codes'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the ValueSet to expand',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Expanded ValueSet with all codes'
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  expand(@Param('id') id: string): Promise<any> {
    return this.valueSetService.expand(id);
  }

  @Get(':id/$validate-code')
  @ApiOperation({
    summary: 'Validate code against ValueSet',
    description: 'Validates whether a given code is in the ValueSet'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the ValueSet',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'system',
    type: String,
    required: true,
    description: 'Code system URI',
    example: 'http://hl7.org/fhir/administrative-gender'
  })
  @ApiQuery({
    name: 'code',
    type: String,
    required: true,
    description: 'Code to validate',
    example: 'male'
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    schema: {
      example: {
        result: true,
        display: 'Male'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'ValueSet not found'
  })
  async validateCode(
    @Param('id') id: string,
    @Query('system') system: string,
    @Query('code') code: string
  ): Promise<any> {
    const result = await this.valueSetService.validateCode(id, system, code);
    return { result };
  }

  private escapeRegexCharacters(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}