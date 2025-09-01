import {Operation} from './operation';
import {Model} from 'mongoose';
import {FhirResourceDocument} from '../../schema/fhir-resource-schema';
import {ConflictException, NotFoundException} from '@nestjs/common';
import {FhirResponse} from '../fhir-response';

/**
 * Handles FHIR Update operations with version conflict detection.
 * Extends the base Operation class to provide resource update functionality.
 */
export class UpdateOperation extends Operation {

    /**
     * Sets up the update operation with the FHIR resource model for database access.
     * @param fhirResourceModel - Mongoose model for FHIR resources
     */
    constructor(fhirResourceModel: Model<FhirResourceDocument>) {

        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }

    /**
     * Updates a FHIR resource in the database with version conflict checking.
     * @param resourceType - The type of FHIR resource to update
     * @param id - The unique identifier of the resource
     * @param resourceData - The new resource data to apply
     * @returns The updated FHIR resource
     */
    async execute(resourceType: string, id: string, resourceData: any): Promise<any> {

        const entity = await this.exists(resourceType, id);

        if (entity) {

            if (resourceData.meta?.versionId && resourceData.meta.versionId !== entity.meta.versionId) {

                throw new ConflictException({
                    resourceType: 'OperationOutcome',
                    issue: [{
                        severity: 'error',
                        code: 'conflict',
                        details: {
                            text: `Version conflict. Expected version ${entity.meta.versionId}, but received ${resourceData.meta.versionId}`,
                        },
                    }],
                });
            }

            const newVersionId = String(parseInt(entity.meta.versionId) + 1);
            const data = this.prepareResourceForUpdate(resourceType, id, resourceData)

            data.meta = { ...data.meta, versionId: newVersionId, lastUpdated: new Date() };

            const updatedResource = await this.fhirResourceModel.findOneAndUpdate(
                {id, resourceType},
                {
                    $set: {
                        ...data,
                    },
                },
                {
                    new: true,
                    lean: true,
                    runValidators: false,
                    select: '-_id'
                }
            )

            if (!updatedResource) {
                throw new Error('Failed to update resource');
            }

            return FhirResponse.format(updatedResource);

        } else {

            throw new NotFoundException({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: {
                        text: `${resourceType}/${id} can not be updated, cos it does not exists`,
                    }
                }]
            })
        }
    }

    /**
     * Prepares a FHIR resource for update by merging new data with existing metadata.
     * @param resourceType - The type of FHIR resource being updated
     * @param id - The unique identifier of the resource
     * @param resourceData - The new resource data to be applied
     * @param existingResource - The current version of the resource in the database
     * @param newVersionId - The new version identifier to be assigned
     * @returns The prepared resource object with merged metadata
     */
    private prepareResourceForUpdate(resourceType: string, id: string, resourceData: any): any {

        return {
            ...resourceData,
            resourceType,
            id
        };
    }
}
