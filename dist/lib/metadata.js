"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metadata = void 0;
class Metadata {
    constructor() {
    }
    get(structures) {
        const response = {
            resourceType: 'CapabilityStatement',
            status: 'active',
            date: new Date().toISOString(),
            kind: 'instance',
            software: {
                name: 'Martijn on Fhir Server',
                version: '1.0.0',
            },
            implementation: {
                description: 'Generic FHIR Server built with NestJS and MongoDB',
            },
            fhirVersion: '4.0.1',
            format: ['json'],
            rest: [{
                    mode: 'server',
                    resource: [],
                }],
        };
        structures.forEach((name) => {
            const entity = {
                type: `${name}`, interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }]
            };
            response.rest[0].resource.push(entity);
        });
        return response;
    }
}
exports.Metadata = Metadata;
//# sourceMappingURL=metadata.js.map