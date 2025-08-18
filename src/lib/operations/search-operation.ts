import {Operation} from './operation'
import {Model} from 'mongoose'
import {FhirResourceDocument} from '../../schema/fhir-resource-schema'
import {NotFoundException} from '@nestjs/common'
import {FhirResponse} from '../fhir-response'
import {SearchResult} from '../../interfaces/search-result'
import {SearchParameters} from '../../interfaces/search-parameters'
import {IncludeOperation} from './include-operation'
import {Request} from 'express'
import {StructureDefinitionDocument} from '../../schema/structure-definition.schema'
import {QueryBuilder} from '../query-builder/query-builder'

/**
 * Handles FHIR search operations for resources in the database.
 * Provides functionality for searching resources by various criteria,
 * including resource type, identifier, and pagination support.
 *
 * This class implements standard FHIR search operations allowing:
 * - Search by resource type and ID
 * - Filtering by identifiers
 * - Support for _include parameters to fetch referenced resources
 * - Pagination using _count and _offset parameters
 * - Filtering by profiles and tags
 * - Element filtering using _elements parameter
 * - Summary views using _summary parameter
 */
export class SearchOperation extends Operation {

    /** Number of resources to return per page. Defaults to 20. */
    count: number = 20

    /** Number of resources to skip for pagination. Defaults to 0. */
    offset: number = 0

    /** Filter criteria for the search query. Defaults to Patient resource type. */
    filter: any = {
        resourceType: 'Patient'
    }

    /** Array of included resources resolved from _include parameters */
    includes: any[] = []

    /** Array of reverse included resources resolved from _revinclude parameters */
    revIncludes: any[] = []

    /** Express request object used for building response URLs */
    request: Request

    /**
     * Creates an instance of SearchOperation.
     *
     * @param fhirResourceModel - Mongoose model for accessing FHIR resources
     * @param request - Express request object used for building response URLs
     * @param structureDefinitonModel - Mongoose model for accessing FHIR StructureDefinitions
     *                                 used in _summary operations
     */
    constructor(fhirResourceModel: Model<FhirResourceDocument>, request: Request, private readonly structureDefinitonModel: Model<StructureDefinitionDocument>) {

        super(fhirResourceModel)

        this.fhirResourceModel = fhirResourceModel
        this.request = request
    }

    /**
     * Searches for FHIR resources by their resource types.
     * Allows searching across multiple resource types in a single query.
     *
     * @returns Promise resolving to a FHIR Bundle containing matching resources
     * @throws Returns error if the database query fails
     * @param resourceType
     * @param searchParams
     */
    async findByType(resourceType: string[], searchParams: SearchParameters): Promise<any> {

        if (searchParams._type) {
            delete searchParams._type
        }

        const qb = new QueryBuilder(resourceType, searchParams)
        const condition = qb.condition

        const resources = await this.fhirResourceModel
            .find(condition)
            .skip(qb.offset)
            .limit(qb.count)
            .sort(qb.sort)
            .select(qb.projection)
            .lean()

        const total = await this.fhirResourceModel.countDocuments(condition)

        return FhirResponse.bundle(resources, total, qb.offset, qb.count, this.request)
    }

    /**
     * Retrieves a specific FHIR resource by its type and ID.
     *
     * @param resourceType - The type of FHIR resource to search for (e.g., 'Patient', 'Observation')
     * @param id - The unique identifier of the resource
     * @param searchParameters
     * @returns Promise resolving to the formatted FHIR resource
     * @throws NotFoundException if the resource is not found
     */
    async findById(resourceType: string, id: string, searchParameters?: SearchParameters): Promise<any> {

        const qb = new QueryBuilder(resourceType, searchParameters, id)
        const resource = await this.fhirResourceModel.findOne({
            resourceType, id
        })
            .select(qb.projection)
            .lean()

        if (!resource) {

            throw new NotFoundException({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: {
                        text: `${resourceType}/${id} not found`
                    }
                }]
            })
        }

        if (searchParameters?._include) {
            const operation = new IncludeOperation(resource, this.fhirResourceModel, this.request)

            this.includes = await operation.execute(searchParameters._include)

            if (this.includes.length >= 1) {
                return operation.getResponse()
            }
        }

        return FhirResponse.format(resource)
    }

    /**
     * Searches for FHIR resources based on search parameters.
     * Supports pagination and filtering by resource type and identifiers.
     *
     * @param resourceType - The type of FHIR resource to search for
     * @param searchParams - Search parameters including _count, _offset, and identifier
     * @returns Promise resolving to a FHIR Bundle containing matching resources
     */
    async find(resourceType: string, searchParams: SearchParameters): Promise<SearchResult> {

        const qb = new QueryBuilder(resourceType, searchParams)
        const condition = qb.condition

        const resources = await this.fhirResourceModel
            .find(condition)
            .skip(qb.offset)
            .limit(qb.count)
            .sort(qb.sort)
            .select(qb.projection)
            .lean()

        const total = await this.fhirResourceModel.countDocuments(condition)

        return FhirResponse.bundle(resources, total, qb.offset, qb.count, this.request)
    }
}
