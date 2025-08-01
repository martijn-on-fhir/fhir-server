"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FhirResponse = void 0;
const uuid_1 = require("uuid");
class FhirResponse {
    static format(resource) {
        return {
            ...resource.resource,
            meta: resource.meta,
        };
    }
    static notValid(result) {
        const response = {
            resourceType: 'OperationOutcome',
            issue: []
        };
        for (const error of result.errors) {
            const issue = {
                severity: 'error',
                code: 'invalid',
                details: {
                    text: error
                }
            };
            response.issue.push(issue);
        }
        return response;
    }
    static notFound(description) {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                    severity: 'error',
                    code: 'not-found',
                    details: {
                        text: `${description}`
                    }
                }]
        };
    }
    static notAcceptatble(description) {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                    severity: 'error',
                    code: 'not-accaptable',
                    details: {
                        text: `${description}`
                    }
                }]
        };
    }
    static bundle(resources, total, resourceType, offset = 0, count = 20) {
        return {
            resourceType: 'Bundle',
            id: (0, uuid_1.v4)(),
            type: 'searchset',
            total,
            link: [{
                    relation: 'self',
                    url: `${resourceType}?_offset=${offset}&_count=${count}`,
                },
                ...(offset + count < total ? [{
                        relation: 'next',
                        url: `${resourceType}?_offset=${offset + count}&_count=${count}`,
                    }] : []),
                ...(offset > 0 ? [{
                        relation: 'previous',
                        url: `${resourceType}?_offset=${Math.max(0, offset - count)}&_count=${count}`,
                    }] : []),
            ],
            entry: resources.map(resource => ({
                fullUrl: `${resourceType}/${resource.id}`,
                resource: FhirResponse.format(resource),
                search: {
                    mode: 'match',
                },
            })),
        };
    }
}
exports.FhirResponse = FhirResponse;
//# sourceMappingURL=fhir-response.js.map