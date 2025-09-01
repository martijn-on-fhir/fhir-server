import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthorizerGuard} from '../guards/authorizer/authorizer.guard';
import {StructureDefinitionService} from '../services/structure-definition/structure-definition.service';
import {CreateStructureDefinitionDto} from '../dto/create-structure-definition-dto';
import {UpdateStructureDefinitionDto} from '../dto/update-structure-definition-dto';

/**
 * Controller handling FHIR StructureDefinition resource operations.
 * Manages structure definitions that define constraints and extensions for FHIR resources.
 */
@UseGuards(AuthorizerGuard)
@ApiTags('Structure Definitions')
@Controller('structure-definition')
export class StructureDefinitionController {

    constructor(private readonly structureDefinitionService: StructureDefinitionService) {
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new FHIR StructureDefinition',
        description: 'Creates a new StructureDefinition resource that defines the structure and constraints for FHIR resources'
    })
    @ApiResponse({
        status: 201,
        description: 'StructureDefinition created successfully',
        schema: {
            example: {
                resourceType: 'StructureDefinition',
                id: '507f1f77bcf86cd799439011',
                url: 'http://hl7.org/fhir/StructureDefinition/Patient',
                release: 4,
                definition: {
                    kind: 'resource',
                    abstract: false,
                    type: 'Patient',
                    baseDefinition: 'http://hl7.org/fhir/StructureDefinition/DomainResource'
                }
            }
        }
    })
    @ApiResponse({status: 400, description: 'Invalid StructureDefinition data or URL already exists'})
    create(@Body() createDto: CreateStructureDefinitionDto): Promise<any> {
        return this.structureDefinitionService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all StructureDefinition resources',
        description: 'Retrieves all StructureDefinition resources with optional filtering'
    })
    @ApiQuery({
        name: 'resourceType',
        type: String,
        required: false,
        description: 'Filter by resource type'
    })
    @ApiQuery({
        name: 'release',
        type: Number,
        required: false,
        description: 'Filter by FHIR release version'
    })
    @ApiResponse({
        status: 200,
        description: 'List of StructureDefinition resources',
        schema: {
            type: 'array',
            items: {
                type: 'object'
            }
        }
    })
    findAll(
        @Query('resourceType') resourceType?: string,
        @Query('release') release?: number
    ): Promise<any[]> {

        const filter: any = {};

        if (resourceType) {
            filter.resourceType = resourceType;
        }

        if (release) {
            filter.release = release;
        }

        return this.structureDefinitionService.findAll(filter);
    }

    @Get('url')
    @ApiOperation({
        summary: 'Get StructureDefinition by canonical URL',
        description: 'Retrieves a StructureDefinition resource by its canonical URL identifier'
    })
    @ApiQuery({
        name: 'url',
        type: String,
        required: true,
        description: 'Canonical URL of the StructureDefinition',
        example: 'http://hl7.org/fhir/StructureDefinition/Patient'
    })
    @ApiResponse({
        status: 200,
        description: 'StructureDefinition resource'
    })
    @ApiResponse({
        status: 404,
        description: 'StructureDefinition not found'
    })
    findByUrl(@Query('url') url: string): Promise<any> {
        return this.structureDefinitionService.findByUrl(url);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get StructureDefinition by ID',
        description: 'Retrieves a specific StructureDefinition resource by its MongoDB ObjectId'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the StructureDefinition',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'StructureDefinition resource'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid StructureDefinition ID'
    })
    @ApiResponse({
        status: 404,
        description: 'StructureDefinition not found'
    })
    findOne(@Param('id') id: string): Promise<any> {
        return this.structureDefinitionService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update StructureDefinition',
        description: 'Updates an existing StructureDefinition resource with new data'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the StructureDefinition to update',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'StructureDefinition updated successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid StructureDefinition data or ID'
    })
    @ApiResponse({
        status: 404,
        description: 'StructureDefinition not found'
    })
    update(@Param('id') id: string, @Body() updateDto: UpdateStructureDefinitionDto): Promise<any> {
        return this.structureDefinitionService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete StructureDefinition',
        description: 'Permanently deletes a StructureDefinition resource'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the StructureDefinition to delete',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'StructureDefinition deleted successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'StructureDefinition not found'
    })
    remove(@Param('id') id: string): Promise<void> {
        return this.structureDefinitionService.delete(id);
    }
}