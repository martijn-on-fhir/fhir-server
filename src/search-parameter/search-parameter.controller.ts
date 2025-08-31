import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthorizerGuard} from '../guards/authorizer/authorizer.guard';
import {SearchParameterService} from '../services/search-parameter/search-parameter.service';
import {CreateSearchParameterDto} from '../dto/create-search-parameter-dto';
import {UpdateSearchParameterDto} from '../dto/update-search-parameter-dto';
import {SearchParameterStatus, SearchParameterType} from '../schema/search-parameter.schema';

@UseGuards(AuthorizerGuard)
@ApiTags('Search Parameters')
@Controller('search-parameter')
export class SearchParameterController {

    constructor(private readonly searchParameterService: SearchParameterService) {
    }

    /**
     * Creates a new FHIR SearchParameter resource
     * @param createDto - The SearchParameter data to create
     * @returns The created SearchParameter
     */
    @Post()
    @ApiOperation({
        summary: 'Create a new FHIR SearchParameter',
        description: 'Creates a new SearchParameter resource that defines how search operations work for FHIR resources'
    })
    @ApiResponse({
        status: 201,
        description: 'SearchParameter created successfully',
        schema: {
            example: {
                resourceType: 'SearchParameter',
                id: '507f1f77bcf86cd799439011',
                url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
                name: 'name',
                status: 'active',
                code: 'name',
                base: ['Patient'],
                type: 'string',
                expression: 'Patient.name'
            }
        }
    })
    @ApiResponse({status: 400, description: 'Invalid SearchParameter data or URL already exists'})
    create(@Body() createDto: CreateSearchParameterDto): Promise<any> {
        return this.searchParameterService.create(createDto);
    }

    /**
     * Retrieves all SearchParameter resources with optional filtering
     * @param status - Optional status filter
     * @param resourceType - Optional base resource type filter
     * @param code - Optional code filter
     * @param type - Optional type filter
     * @returns Array of matching SearchParameter resources
     */
    @Get()
    @ApiOperation({
        summary: 'Get all SearchParameter resources',
        description: 'Retrieves all SearchParameter resources with optional filtering by status, resource type, code, or type'
    })
    @ApiQuery({
        name: 'status',
        enum: SearchParameterStatus,
        required: false,
        description: 'Filter by publication status'
    })
    @ApiQuery({
        name: 'base',
        type: String,
        required: false,
        description: 'Filter by base resource type (e.g., Patient, Observation)'
    })
    @ApiQuery({
        name: 'code',
        type: String,
        required: false,
        description: 'Filter by search parameter code'
    })
    @ApiQuery({
        name: 'type',
        enum: SearchParameterType,
        required: false,
        description: 'Filter by search parameter type'
    })
    @ApiResponse({
        status: 200,
        description: 'List of SearchParameter resources',
        schema: {
            type: 'array',
            items: {
                type: 'object'
            }
        }
    })
    findAll(
        @Query('status') status?: SearchParameterStatus,
        @Query('base') base?: string,
        @Query('code') code?: string,
        @Query('type') type?: SearchParameterType
    ): Promise<any[]> {

        const filter: any = {};

        if (status && this.isValidSearchParameterStatus(status)) {
            filter.status = status;
        }

        if (base) {
            filter.base = base;
        }

        if (code) {
            const sanitizedCode = this.escapeRegexCharacters(code);
            filter.code = new RegExp(sanitizedCode, 'i');
        }

        if (type && this.isValidSearchParameterType(type)) {
            filter.type = type;
        }

        return this.searchParameterService.findAll(filter);
    }

    /**
     * Retrieves SearchParameter resources by base resource type
     * @param resourceType - FHIR resource type
     * @returns Array of SearchParameter resources for the specified resource type
     */
    @Get('resource-type/:resourceType')
    @ApiOperation({
        summary: 'Get SearchParameter resources by resource type',
        description: 'Retrieves all active SearchParameter resources that apply to a specific FHIR resource type'
    })
    @ApiParam({
        name: 'resourceType',
        description: 'FHIR resource type (e.g., Patient, Observation)',
        example: 'Patient'
    })
    @ApiResponse({
        status: 200,
        description: 'List of SearchParameter resources for the resource type'
    })
    findByResourceType(@Param('resourceType') resourceType: string): Promise<any[]> {
        return this.searchParameterService.findByResourceType(resourceType);
    }

    /**
     * Retrieves a SearchParameter resource by its canonical URL
     * @param url - Canonical URL of the SearchParameter
     * @returns The SearchParameter with the specified URL
     */
    @Get('url')
    @ApiOperation({
        summary: 'Get SearchParameter by canonical URL',
        description: 'Retrieves a SearchParameter resource by its canonical URL identifier'
    })
    @ApiQuery({
        name: 'url',
        type: String,
        required: true,
        description: 'Canonical URL of the SearchParameter',
        example: 'http://hl7.org/fhir/SearchParameter/Patient-name'
    })
    @ApiResponse({
        status: 200,
        description: 'SearchParameter resource'
    })
    @ApiResponse({
        status: 404,
        description: 'SearchParameter not found'
    })
    findByUrl(@Query('url') url: string): Promise<any> {
        return this.searchParameterService.findByUrl(url);
    }

    /**
     * Retrieves a SearchParameter resource by its ID
     * @param id - The ID of the SearchParameter
     * @returns The SearchParameter with the specified ID
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Get SearchParameter by ID',
        description: 'Retrieves a specific SearchParameter resource by its MongoDB ObjectId'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the SearchParameter',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'SearchParameter resource'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid SearchParameter ID'
    })
    @ApiResponse({
        status: 404,
        description: 'SearchParameter not found'
    })
    findOne(@Param('id') id: string): Promise<any> {
        return this.searchParameterService.findOne(id);
    }

    /**
     * Updates an existing SearchParameter resource
     * @param id - The ID of the SearchParameter to update
     * @param updateDto - The updated SearchParameter data
     * @returns The updated SearchParameter
     */
    @Put(':id')
    @ApiOperation({
        summary: 'Update SearchParameter',
        description: 'Updates an existing SearchParameter resource with new data'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the SearchParameter to update',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'SearchParameter updated successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid SearchParameter data or ID'
    })
    @ApiResponse({
        status: 404,
        description: 'SearchParameter not found'
    })
    update(@Param('id') id: string, @Body() updateDto: UpdateSearchParameterDto): Promise<any> {
        return this.searchParameterService.update(id, updateDto);
    }

    /**
     * Deletes a SearchParameter resource
     * @param id - The ID of the SearchParameter to delete
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete SearchParameter',
        description: 'Permanently deletes a SearchParameter resource'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the SearchParameter to delete',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'SearchParameter deleted successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'SearchParameter not found'
    })
    remove(@Param('id') id: string): Promise<void> {
        return this.searchParameterService.delete(id);
    }

    /**
     * Validates if the given value is a valid SearchParameterStatus enum value
     */
    private isValidSearchParameterStatus(value: string): value is SearchParameterStatus {
        return Object.values(SearchParameterStatus).includes(value as SearchParameterStatus);
    }

    /**
     * Validates if the given value is a valid SearchParameterType enum value
     */
    private isValidSearchParameterType(value: string): value is SearchParameterType {
        return Object.values(SearchParameterType).includes(value as SearchParameterType);
    }

    /**
     * Escapes special regex characters in user input to prevent regex injection
     */
    private escapeRegexCharacters(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}