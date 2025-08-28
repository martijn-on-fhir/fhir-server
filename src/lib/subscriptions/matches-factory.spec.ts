import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchesFactory } from './matches-factory';
import { Matches } from './matches';
import { SubscriptionDocument, SubscriptionSchema } from '../../schema/subscription-schema';

describe('MatchesFactory', () => {
  let factory: MatchesFactory;
  let mockSubscriptionModel: jest.Mocked<Model<SubscriptionDocument>>;

  const mockResource = {
    resourceType: 'Observation',
    id: 'obs-001',
    status: 'final',
    meta: {
      profile: ['http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure']
    }
  };

  beforeEach(async () => {
    mockSubscriptionModel = {
      find: jest.fn(),
      exec: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesFactory,
        {
          provide: getModelToken(SubscriptionSchema.name),
          useValue: mockSubscriptionModel
        }
      ],
    }).compile();

    factory = module.get<MatchesFactory>(MatchesFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(factory).toBeDefined();
    });

    it('should inject subscription model correctly', () => {
      expect(factory['subscriptionModel']).toBe(mockSubscriptionModel);
    });
  });

  describe('create', () => {
    it('should create a new Matches instance', () => {
      const matcher = factory.create(mockResource);
      
      expect(matcher).toBeInstanceOf(Matches);
      expect(matcher.resource).toBe(mockResource);
      expect(matcher['subscriptionModel']).toBe(mockSubscriptionModel);
    });

    it('should create different instances for different resources', () => {
      const resource1 = { resourceType: 'Patient', id: '1' };
      const resource2 = { resourceType: 'Observation', id: '2' };

      const matcher1 = factory.create(resource1);
      const matcher2 = factory.create(resource2);
      
      expect(matcher1).not.toBe(matcher2);
      expect(matcher1.resource).toBe(resource1);
      expect(matcher2.resource).toBe(resource2);
    });

    it('should handle empty resource object', () => {
      const emptyResource = {};
      
      const matcher = factory.create(emptyResource);
      
      expect(matcher).toBeInstanceOf(Matches);
      expect(matcher.resource).toBe(emptyResource);
    });

    it('should handle null resource', () => {
      const matcher = factory.create(null as any);
      
      expect(matcher).toBeInstanceOf(Matches);
      expect(matcher.resource).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should create functional matcher for Blood Pressure observation', () => {
      const bloodPressureResource = {
        resourceType: 'Observation',
        id: 'bp-001',
        meta: {
          profile: ['http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure']
        },
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        }
      };

      const matcher = factory.create(bloodPressureResource);
      
      // Test that created matcher can perform basic matching
      const profileMatch = matcher.matchesCriteria(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
      expect(profileMatch).toBe(true);

      const statusMatch = matcher.matchesCriteria('Observation?status=final');
      expect(statusMatch).toBe(true);

      const noMatch = matcher.matchesCriteria('Patient?active=true');
      expect(noMatch).toBe(false);
    });

    it('should create functional matcher for Patient resource', () => {
      const patientResource = {
        resourceType: 'Patient',
        id: 'patient-001',
        active: true,
        name: [{ family: 'Doe', given: ['John'] }]
      };

      const matcher = factory.create(patientResource);
      
      const activeMatch = matcher.matchesCriteria('Patient?active=true');
      expect(activeMatch).toBe(true);

      const inactiveMatch = matcher.matchesCriteria('Patient?active=false');
      expect(inactiveMatch).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle undefined resource gracefully', () => {
      const matcher = factory.create(undefined as any);
      
      expect(matcher).toBeInstanceOf(Matches);
      expect(matcher.resource).toBeUndefined();
    });

    it('should maintain model reference in created instances', () => {
      const resource1 = { resourceType: 'Patient', id: '1' };
      const resource2 = { resourceType: 'Observation', id: '2' };

      const matcher1 = factory.create(resource1);
      const matcher2 = factory.create(resource2);
      
      expect(matcher1['subscriptionModel']).toBe(mockSubscriptionModel);
      expect(matcher2['subscriptionModel']).toBe(mockSubscriptionModel);
      expect(matcher1['subscriptionModel']).toBe(matcher2['subscriptionModel']);
    });
  });
});