import {FhirResourceDocument} from "../../schema/fhir-resource-schema";
import {Model} from "mongoose";
import {Request} from 'express';

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

    async execute(revIncludes: string | string[]): Promise<any[]> {

        const entities = Array.isArray(revIncludes) ? revIncludes : [revIncludes]

        return Promise.resolve([])
    }
}