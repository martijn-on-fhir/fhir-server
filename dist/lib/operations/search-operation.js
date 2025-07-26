"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperation = void 0;
const operation_1 = require("./operation");
const common_1 = require("@nestjs/common");
const fhir_response_1 = require("../fhir-response");
class SearchOperation extends operation_1.Operation {
    constructor(fhirResourceModel) {
        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }
    async findById(resourceType, id) {
        const resource = await this.fhirResourceModel.findOne({
            resourceType, id, status: 'active',
        }).exec();
        if (!resource) {
            throw new common_1.NotFoundException({
                resourceType: 'OperationOutcome',
                issue: [{
                        severity: 'error',
                        code: 'not-found',
                        details: {
                            text: `${resourceType}/${id} not found`,
                        },
                    }],
            });
        }
        return fhir_response_1.FhirResponse.format(resource);
    }
    async find(resourceType, searchParams) {
        const query = {
            resourceType,
            status: 'active',
        };
        Object.keys(searchParams).forEach(key => {
            if (key === '_count')
                return;
            if (key === '_offset')
                return;
            if (key === '_sort')
                return;
            query[`searchParams.${key}`] = searchParams[key];
        });
        const count = parseInt(searchParams._count) || 20;
        const offset = parseInt(searchParams._offset) || 0;
        let sort = { 'meta.lastUpdated': -1 };
        if (searchParams._sort) {
            const sortField = searchParams._sort.startsWith('-')
                ? searchParams._sort.substring(1)
                : searchParams._sort;
            const sortOrder = searchParams._sort.startsWith('-') ? -1 : 1;
            sort = { [`searchParams.${sortField}`]: sortOrder };
        }
        const resources = await this.fhirResourceModel
            .find(query)
            .skip(offset)
            .limit(count)
            .sort(sort)
            .exec();
        const total = await this.fhirResourceModel.countDocuments(query);
        return fhir_response_1.FhirResponse.bundle(resources, total, resourceType, offset, count);
    }
}
exports.SearchOperation = SearchOperation;
//# sourceMappingURL=search-operation.js.map