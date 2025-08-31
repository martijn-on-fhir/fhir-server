import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthorizerGuard} from '../guards/authorizer/authorizer.guard';
import {ValueSetService} from '../services/value-set/value-set.service';
import {CreateValueSetDto} from '../dto/create-value-set-dto';
import {UpdateValueSetDto} from '../dto/update-value-set-dto';

@UseGuards(AuthorizerGuard)
@ApiTags('Value Sets')
@Controller('value-set')
export class ValueSetController {

    constructor(private readonly valueSetService: ValueSetService) {
    }

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
                _id: '507f1f77bcf86cd799439011',
                url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
                resourceType: 'ValueSet',
                expansion: [
                    {
                        system: 'http://hl7.org/fhir/administrative-gender',
                        code: 'male',
                        display: 'Male'
                    },
                    {
                        system: 'http://hl7.org/fhir/administrative-gender',
                        code: 'female',
                        display: 'Female'
                    }
                ],
                value: {
                    resourceType: 'ValueSet',
                    id: 'administrative-gender',
                    url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
                    name: 'AdministrativeGender',
                    title: 'Administrative Gender',
                    status: 'active'
                }
            }
        }
    })
    @ApiResponse({status: 400, description: 'Invalid ValueSet data or URL already exists'})
    create(@Body() createDto: CreateValueSetDto): Promise<any> {
        return this.valueSetService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all ValueSet resources',
        description: 'Retrieves all ValueSet resources with optional filtering'
    })
    @ApiQuery({
        name: 'resourceType',
        type: String,
        required: false,
        description: 'Filter by resource type'
    })
    @ApiQuery({
        name: 'url',
        type: String,
        required: false,
        description: 'Filter by canonical URL (partial match)'
    })
    @ApiResponse({
        status: 200,
        description: 'List of ValueSet resources',
        schema: {
            type: 'array',
            items: {
                type: 'object'
            }
        }
    })
    findAll(
        @Query('resourceType') resourceType?: string,
        @Query('url') url?: string
    ): Promise<any[]> {

        const filter: any = {};

        if (resourceType) {
            filter.resourceType = resourceType;
        }

        if (url) {
            const sanitizedUrl = this.escapeRegexCharacters(url);
            filter.url = new RegExp(sanitizedUrl, 'i');
        }

        return this.valueSetService.findAll(filter);
    }

    @Get('url')
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
        description: 'Retrieves a specific ValueSet resource by its MongoDB ObjectId'
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB ObjectId of the ValueSet',
        example: '507f1f77bcf86cd799439011'
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
        description: 'MongoDB ObjectId of the ValueSet to update',
        example: '507f1f77bcf86cd799439011'
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
        description: 'MongoDB ObjectId of the ValueSet to delete',
        example: '507f1f77bcf86cd799439011'
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

    private escapeRegexCharacters(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}