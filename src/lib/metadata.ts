export class Metadata {
  
  constructor() {
  }
  
  get() {
    
    return {
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
        resource: [
          { type: 'Patient', interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }] },
          { type: 'Observation', interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }] },
        ],
      }],
    };
  }
}
