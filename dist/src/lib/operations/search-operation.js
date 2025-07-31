"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperation = void 0;
const operation_1 = require("./operation");
const common_1 = require("@nestjs/common");
const fhir_response_1 = require("../fhir-response");
const lodash_es_1 = require("lodash-es");
class SearchOperation extends operation_1.Operation {
    count = 20;
    offset = 0;
    sort = { 'resource.meta.lastUpdated': 1 };
    filter = {
        resourceType: 'Patient',
    };
    constructor(fhirResourceModel) {
        super(fhirResourceModel);
        this.fhirResourceModel = fhirResourceModel;
    }
    async findById(resourceType, id) {
        const resource = await this.fhirResourceModel.findOne({
            resourceType, 'resource.id': id,
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
        this.filter = {
            resourceType,
            resource: {},
        };
        this.count = searchParams._count ? parseInt(searchParams._count) : 20;
        this.offset = searchParams._offset ? parseInt(searchParams._offset) : 0;
        this.appendId(searchParams?._id);
        this.appendIdentifier(searchParams?.identifier);
        this.appendProfile(searchParams?._profile);
        const query = this.transformToDotNotation(this.filter);
        console.dir(query);
        const resources = await this.fhirResourceModel
            .find(query)
            .skip(this.offset)
            .limit(this.count)
            .sort(this.sort)
            .exec();
        const total = await this.fhirResourceModel.countDocuments(query);
        return fhir_response_1.FhirResponse.bundle(resources, total, resourceType, this.offset, this.count);
    }
    appendId(id) {
        if (id) {
            this.filter.resource.id = id;
        }
    }
    appendIdentifier(entity) {
        this.filter.resource.identifier = [];
        const identifiers = [];
        if (typeof entity === 'string') {
            identifiers.push(entity);
        }
        for (const identifier of identifiers) {
            const [system, value] = identifier.split('|');
            const config = {
                system,
            };
            if (value) {
                Object.assign(config, {
                    value,
                });
            }
            this.filter.resource.identifier = config;
        }
        if (this.filter.resource.identifier.length === 0) {
            delete this.filter.resource.identifier;
        }
    }
    appendProfile(profile) {
        if (profile) {
            (0, lodash_es_1.set)(this.filter, 'resource.meta.profile', profile);
        }
    }
    transformToDotNotation(nestedQuery, prefix = '') {
        const transformed = {};
        for (const key in nestedQuery) {
            if (nestedQuery.hasOwnProperty(key)) {
                const currentKey = prefix ? `${prefix}.${key}` : key;
                const value = nestedQuery[key];
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(transformed, this.transformToDotNotation(value, currentKey));
                }
                else {
                    transformed[currentKey] = value;
                }
            }
        }
        return transformed;
    }
}
exports.SearchOperation = SearchOperation;
//# sourceMappingURL=search-operation.js.map