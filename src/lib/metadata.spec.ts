import { Metadata } from './metadata';

describe('Metadata', () => {
  let metadata: Metadata;

  beforeEach(() => {
    metadata = new Metadata();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(metadata).toBeDefined();
      expect(metadata).toBeInstanceOf(Metadata);
    });
  });

  describe('get', () => {
    it('should return a valid FHIR CapabilityStatement with empty structures array', () => {
      const structures: any[] = [];
      const result = metadata.get(structures);

      expect(result).toEqual({
        resourceType: 'CapabilityStatement',
        status: 'active',
        date: expect.any(String),
        kind: 'instance',
        software: {
          name: 'Martijn on Fhir Server',
          version: '1.0.0'
        },
        implementation: {
          description: 'Generic FHIR Server built with NestJS and MongoDB'
        },
        fhirVersion: '4.0.1',
        format: ['json'],
        rest: [{
          mode: 'server',
          resource: []
        }]
      });
    });

    it('should include resource interactions for single structure', () => {
      const structures = [{ type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' }];
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource).toHaveLength(1);
      expect(result.rest[0].resource[0]).toEqual({
        type: 'Patient',
        profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
        supportedProfile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
        interaction: [
          { code: 'read' },
          { code: 'create' },
          { code: 'update' },
          { code: 'delete' },
          { code: 'search-type' }
        ]
      });
    });

    it('should include resource interactions for multiple structures', () => {
      const structures = [
        { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' },
        { type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' },
        { type: 'Practitioner', url: 'http://hl7.org/fhir/StructureDefinition/Practitioner' }
      ];
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource).toHaveLength(3);

      expect(result.rest[0].resource[0]).toEqual({
        type: 'Patient',
        profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
        supportedProfile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
        interaction: [
          { code: 'read' },
          { code: 'create' },
          { code: 'update' },
          { code: 'delete' },
          { code: 'search-type' }
        ]
      });

      expect(result.rest[0].resource[1]).toEqual({
        type: 'Observation',
        profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
        supportedProfile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        interaction: [
          { code: 'read' },
          { code: 'create' },
          { code: 'update' },
          { code: 'delete' },
          { code: 'search-type' }
        ]
      });

      expect(result.rest[0].resource[2]).toEqual({
        type: 'Practitioner',
        profile: 'http://hl7.org/fhir/StructureDefinition/Practitioner',
        supportedProfile: ['http://hl7.org/fhir/StructureDefinition/Practitioner'],
        interaction: [
          { code: 'read' },
          { code: 'create' },
          { code: 'update' },
          { code: 'delete' },
          { code: 'search-type' }
        ]
      });
    });

    it('should generate current ISO date string', () => {
      const beforeCall = new Date();
      const result = metadata.get([]) as any;
      const afterCall = new Date();

      const resultDate = new Date(result.date);
      expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      
      // Verify it's a valid ISO string
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should maintain consistent structure with different resource types', () => {
      const structures = [
        { type: 'Bundle', url: 'http://hl7.org/fhir/StructureDefinition/Bundle' },
        { type: 'StructureDefinition', url: 'http://hl7.org/fhir/StructureDefinition/StructureDefinition' },
        { type: 'ValueSet', url: 'http://hl7.org/fhir/StructureDefinition/ValueSet' }
      ];
      const result = metadata.get(structures) as any;

      expect(result.resourceType).toBe('CapabilityStatement');
      expect(result.status).toBe('active');
      expect(result.kind).toBe('instance');
      expect(result.fhirVersion).toBe('4.0.1');
      expect(result.format).toEqual(['json']);
      expect(result.rest).toHaveLength(1);
      expect(result.rest[0].mode).toBe('server');
      expect(result.rest[0].resource).toHaveLength(3);
    });

    it('should handle large numbers of structures', () => {
      const structures = Array.from({ length: 50 }, (_, i) => ({
        type: `Resource${i + 1}`,
        url: `http://hl7.org/fhir/StructureDefinition/Resource${i + 1}`
      }));
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource).toHaveLength(50);

      // Check first and last resources
      expect(result.rest[0].resource[0].type).toBe('Resource1');
      expect(result.rest[0].resource[49].type).toBe('Resource50');

      // Verify all have the same interaction pattern
      result.rest[0].resource.forEach((resource: any, index: number) => {
        expect(resource.type).toBe(`Resource${index + 1}`);
        expect(resource.profile).toBe(`http://hl7.org/fhir/StructureDefinition/Resource${index + 1}`);
        expect(resource.supportedProfile).toEqual([`http://hl7.org/fhir/StructureDefinition/Resource${index + 1}`]);
        expect(resource.interaction).toEqual([
          { code: 'read' },
          { code: 'create' },
          { code: 'update' },
          { code: 'delete' },
          { code: 'search-type' }
        ]);
      });
    });

    it('should handle duplicate structure names', () => {
      const structures = [
        { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' },
        { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' },
        { type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' },
        { type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' }
      ];
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource).toHaveLength(4);

      // All Patient resources should be identical
      const patientResources = result.rest[0].resource.filter((r: any) => r.type === 'Patient');
      expect(patientResources).toHaveLength(3);

      patientResources.forEach((resource: any) => {
        expect(resource).toEqual({
          type: 'Patient',
          profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
          supportedProfile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'update' },
            { code: 'delete' },
            { code: 'search-type' }
          ]
        });
      });
    });

    it('should handle special characters in structure names', () => {
      const structures = [
        { type: 'Patient-Test', url: 'http://example.com/StructureDefinition/Patient-Test' },
        { type: 'Observation_V2', url: 'http://example.com/StructureDefinition/Observation_V2' },
        { type: 'Custom$Resource', url: 'http://example.com/StructureDefinition/Custom$Resource' }
      ];
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource[0].type).toBe('Patient-Test');
      expect(result.rest[0].resource[1].type).toBe('Observation_V2');
      expect(result.rest[0].resource[2].type).toBe('Custom$Resource');
    });

    it('should preserve object structure integrity', () => {
      const structures = [{ type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' }];
      const result1 = metadata.get(structures);
      const result2 = metadata.get(structures);

      // Results should be separate objects (not the same reference)
      expect(result1).not.toBe(result2);

      // But should have the same structure (excluding date which will differ)
      expect((result1 as any).resourceType).toBe((result2 as any).resourceType);
      expect((result1 as any).status).toBe((result2 as any).status);
      expect((result1 as any).software).toEqual((result2 as any).software);
    });

    it('should include all required FHIR CapabilityStatement fields', () => {
      const result = metadata.get([{ type: 'Patient', url: 'http://hl7.org/fhir/StructureDefinition/Patient' }]) as any;

      // Check for required fields according to FHIR spec
      expect(result.resourceType).toBe('CapabilityStatement');
      expect(result.status).toBeDefined();
      expect(result.date).toBeDefined();
      expect(result.kind).toBeDefined();
      expect(result.fhirVersion).toBeDefined();
      expect(result.format).toBeDefined();
      expect(result.rest).toBeDefined();
      expect(Array.isArray(result.rest)).toBe(true);
    });

    it('should include software information', () => {
      const result = metadata.get([]) as any;

      expect(result.software).toBeDefined();
      expect(result.software.name).toBe('Martijn on Fhir Server');
      expect(result.software.version).toBe('1.0.0');
    });

    it('should include implementation description', () => {
      const result = metadata.get([]) as any;

      expect(result.implementation).toBeDefined();
      expect(result.implementation.description).toBe('Generic FHIR Server built with NestJS and MongoDB');
    });

    it('should support only json format', () => {
      const result = metadata.get([]) as any;

      expect(result.format).toEqual(['json']);
      expect(result.format).toHaveLength(1);
    });

    it('should configure server mode REST endpoint', () => {
      const result = metadata.get([]) as any;

      expect(result.rest).toHaveLength(1);
      expect(result.rest[0].mode).toBe('server');
      expect(result.rest[0].resource).toBeDefined();
      expect(Array.isArray(result.rest[0].resource)).toBe(true);
    });

    it('should support all CRUD operations plus search', () => {
      const structures = [{ type: 'TestResource', url: 'http://example.com/StructureDefinition/TestResource' }];
      const result = metadata.get(structures) as any;

      const resource = result.rest[0].resource[0];
      const interactionCodes = resource.interaction.map((i: any) => i.code);

      expect(interactionCodes).toContain('read');
      expect(interactionCodes).toContain('create');
      expect(interactionCodes).toContain('update');
      expect(interactionCodes).toContain('delete');
      expect(interactionCodes).toContain('search-type');
      expect(interactionCodes).toHaveLength(5);
    });
  });

  describe('Edge cases', () => {
    it('should throw error for null or undefined input', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(() => metadata.get(null as any)).toThrow('Cannot read properties of null (reading \'forEach\')');
      expect(() => metadata.get(undefined as any)).toThrow('Cannot read properties of undefined (reading \'forEach\')');
    });

    it('should handle empty string structure names', () => {
      const structures = [
        { type: '', url: '' },
        { type: '  ', url: '  ' },
        { type: 'ValidResource', url: 'http://example.com/StructureDefinition/ValidResource' }
      ];
      const result = metadata.get(structures) as any;

      expect(result.rest[0].resource).toHaveLength(3);
      expect(result.rest[0].resource[0].type).toBe('');
      expect(result.rest[0].resource[1].type).toBe('  ');
      expect(result.rest[0].resource[2].type).toBe('ValidResource');
    });
  });
});