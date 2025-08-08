"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOperation = void 0;
const operation_1 = require("./operation");
const uuid_1 = require("uuid");
const fhir_response_1 = require("../fhir-response");
const common_1 = require("@nestjs/common");
class CreateOperation extends operation_1.Operation {
    constructor(fhirResourceModel) {
        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }
    async execute(resourceType, resourceData) {
        const id = typeof resourceData.id === 'string' ? resourceData.id : (0, uuid_1.v4)();
        const exsits = await this.exists(resourceType, id);
        if (!exsits) {
            resourceData.id = id;
            const fhirResource = new this.fhirResourceModel({
                ...resourceData
            });
            const saved = await fhirResource.save();
            return fhir_response_1.FhirResponse.format(saved);
        }
        else {
            throw new common_1.NotAcceptableException({
                resourceType: 'OperationOutcome',
                issue: [{
                        severity: 'error',
                        code: 'Resource already exists',
                        details: {
                            text: `${resourceType}/${id} already deleted`,
                        },
                    }],
            });
        }
    }
}
exports.CreateOperation = CreateOperation;
//# sourceMappingURL=create-operation.js.map