"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = void 0;
class Operation {
    fhirResourceModel;
    constructor(fhirResourceModel) {
        this.fhirResourceModel = fhirResourceModel;
    }
    async exists(resourceType, id) {
        const exists = await this.fhirResourceModel.findOne({
            resourceType,
            id,
            'resource.active': true,
        });
        return exists;
    }
}
exports.Operation = Operation;
//# sourceMappingURL=operation.js.map