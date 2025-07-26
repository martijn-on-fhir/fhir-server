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
            status: 'active',
        });
        return exists;
    }
    extractSearchParams(resourceType, resource) {
        const searchParams = {};
        switch (resourceType) {
            case 'Patient':
                if (resource.name)
                    searchParams.name = resource.name[0]?.family || resource.name[0]?.given?.join(' ');
                if (resource.gender)
                    searchParams.gender = resource.gender;
                if (resource.birthDate)
                    searchParams.birthdate = resource.birthDate;
                break;
            case 'Observation':
                if (resource.subject)
                    searchParams.patient = resource.subject.reference;
                if (resource.code)
                    searchParams.code = resource.code.coding?.[0]?.code;
                if (resource.effectiveDateTime)
                    searchParams.date = resource.effectiveDateTime;
                break;
            default:
                if (resource.id)
                    searchParams._id = resource.id;
                break;
        }
        return searchParams;
    }
}
exports.Operation = Operation;
//# sourceMappingURL=operation.js.map