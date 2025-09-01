/**
 * Generates FHIR CapabilityStatement metadata for the server.
 * Provides information about supported resources and operations.
 */
export class Metadata {
  
  constructor() {
  }
  
  /**
   * Builds a FHIR CapabilityStatement based on available structure definitions.
   * @param structures - Array of FHIR resource types supported by the server
   * @returns FHIR CapabilityStatement with supported resources and operations
   */
  get(structures: string[]): object {
    
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
    
    structures.forEach((name: string) => {
      
      const entity = {
        type: `${name}`, interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }]
      }
      
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      response.rest[0].resource.push(entity);
    });
    
    return response;
  }
}
