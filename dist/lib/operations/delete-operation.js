"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteOperation = void 0;
const common_1 = require("@nestjs/common");
const operation_1 = require("./operation");
class DeleteOperation extends operation_1.Operation {
    constructor(fhirResourceModel) {
        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }
    async execute(resourceType, id) {
        try {
            const entity = await this.exists(resourceType, id);
            if (!entity) {
                throw new common_1.NotFoundException({
                    resourceType: 'OperationOutcome',
                    issue: [{
                            severity: 'error',
                            code: 'not-found',
                            details: {
                                text: `${resourceType}/${id} not found or already deleted`,
                            },
                        }],
                });
            }
            const updatedResource = await this.updateResource(resourceType, id, entity);
            if (!updatedResource) {
                throw new Error('Failed to delete resource');
            }
            return {
                resourceType: 'OperationOutcome',
                issue: [{
                        severity: 'information',
                        code: 'deleted',
                        details: {
                            text: `${resourceType}/${id} has been deleted`,
                        },
                    }],
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
        }
    }
    async updateResource(resourceType, id, entity) {
        return this.fhirResourceModel.findOneAndUpdate({ resourceType, id, status: 'active' }, {
            $set: {
                status: 'inactive',
                'meta.versionId': String(parseInt(entity.meta?.versionId ?? 0) + 1),
                'meta.lastUpdated': new Date(),
            },
            $push: {
                tags: 'deleted',
            },
        }, { new: true });
    }
}
exports.DeleteOperation = DeleteOperation;
//# sourceMappingURL=delete-operation.js.map