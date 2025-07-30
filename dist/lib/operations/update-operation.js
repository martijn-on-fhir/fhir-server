"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOperation = void 0;
const operation_1 = require("./operation");
const common_1 = require("@nestjs/common");
const fhir_response_1 = require("../fhir-response");
class UpdateOperation extends operation_1.Operation {
    constructor(fhirResourceModel) {
        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }
    async execute(resourceType, id, resourceData) {
        const entity = await this.exists(resourceType, id);
        if (entity) {
            if (resourceData.meta?.versionId && resourceData.meta.versionId !== entity.meta.versionId) {
                throw new common_1.ConflictException({
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
            const updatedResourceData = this.prepareResourceForUpdate(resourceType, id, resourceData);
            const updatedResource = await this.fhirResourceModel.findOneAndUpdate({ resourceType, id }, {
                $set: {
                    resource: updatedResourceData,
                    'resource.meta.versionId': newVersionId,
                    '.resource.meta.lastUpdated': new Date(),
                },
            }, {
                new: true,
                runValidators: true,
            });
            if (!updatedResource) {
                throw new Error('Failed to update resource');
            }
            return fhir_response_1.FhirResponse.format(updatedResource);
        }
        else {
            throw new common_1.NotFoundException({
                resourceType: 'OperationOutcome',
                issue: [{
                        severity: 'error',
                        code: 'not-found',
                        details: {
                            text: `${resourceType}/${id} can not be updated, cos it does not exists`,
                        }
                    }]
            });
        }
    }
    prepareResourceForUpdate(resourceType, id, resourceData) {
        return {
            ...resourceData,
            resourceType,
            id
        };
    }
}
exports.UpdateOperation = UpdateOperation;
//# sourceMappingURL=update-operation.js.map