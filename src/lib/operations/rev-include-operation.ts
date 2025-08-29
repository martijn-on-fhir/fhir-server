import {FhirResourceDocument} from "../../schema/fhir-resource-schema";
import {Model} from "mongoose";
import {Request} from 'express';
import { searchParameterMap } from '../search-parameter-map';
import { OperationHelpers } from './operation-helpers';

export class RevIncludeOperation {

    /** Collection of resolved resources including the primary resource and referenced resources */
    collection: any[] = []

    /** The primary FHIR resource being processed */
    resource

    /**
     * Creates an instance of IncludeOperation.
     * @param model - The source model containing the primary resource
     * @param fhirResourceModel - Mongoose model for FHIR resources
     * @param request
     */
    constructor(private readonly model: any, private readonly fhirResourceModel: Model<FhirResourceDocument>, private readonly request: Request) {

        this.resource = this.model
        this.collection = []
    }

    /**
     * Executes operations to retrieve and process resources that reference the current resource.
     *
     * @param {string|string[]} revIncludes - A string or an array of strings representing the reverse include paths.
     * Each path specifies the related resources to search for.
     * @return {Promise<any[]>} A promise that resolves to an array of referencing resources that match the search criteria.
     */
    async execute(revIncludes: string | string[]): Promise<any[]> {

        const entities = Array.isArray(revIncludes) ? revIncludes : [revIncludes]
        const instructions = entities.map(OperationHelpers.parseInstruction)
        
        for (const instruction of instructions) {

            const { sourceResource, searchParameter } = instruction
            const definition = searchParameterMap.get(`${sourceResource}:${searchParameter}`)
            
            if (definition) {

                const { path } = definition
                const reference = `${this.resource.resourceType}/${this.resource.id}`
                
                // Query for resources that reference the current resource
                const referencingResources = await this.fhirResourceModel.find({
                    resourceType: sourceResource,
                    [path]: reference
                }).lean()
                
                this.collection.push(...referencingResources)
            }
        }
        
        return this.collection
    }
}