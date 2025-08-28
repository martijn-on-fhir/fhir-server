import { Matches } from './matches';
import { SubscriptionDocument, SubscriptionStatus } from '../../schema/subscription-schema';
import { Model } from 'mongoose';

describe('Matches', () => {
  let mockSubscriptionModel: jest.Mocked<Model<SubscriptionDocument>>;
  let matches: Matches;

  const mockBloodPressureResource = {
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
    },
    subject: {
      reference: 'Patient/123'
    }
  };

  const mockPatientResource = {
    resourceType: 'Patient',
    id: 'patient-001',
    active: true,
    name: [{
      family: 'Doe',
      given: ['John']
    }]
  };

  const mockSubscriptions: Partial<SubscriptionDocument>[] = [
    {
      _id: 'sub1' as any,
      status: SubscriptionStatus.ACTIVE,
      criteria: 'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure',
      channel: { type: 'rest-hook', endpoint: 'https://example.com/webhook1' } as any
    },
    {
      _id: 'sub2' as any,
      status: SubscriptionStatus.ACTIVE,
      criteria: 'Observation?code=85354-9',
      channel: { type: 'rest-hook', endpoint: 'https://example.com/webhook2' } as any
    },
    {
      _id: 'sub3' as any,
      status: SubscriptionStatus.ACTIVE,
      criteria: 'Patient?active=true',
      channel: { type: 'websocket' } as any
    },
    {
      _id: 'sub4' as any,
      status: SubscriptionStatus.ACTIVE,
      criteria: 'Observation?subject=Patient/123',
      channel: { type: 'rest-hook', endpoint: 'https://example.com/webhook4' } as any
    }
  ];

  beforeEach(() => {
    mockSubscriptionModel = {
      find: jest.fn(),
      exec: jest.fn()
    } as any;

    // Setup default mock behavior
    const mockQuery = {
      exec: jest.fn().mockResolvedValue(mockSubscriptions.filter(sub =>
        sub.criteria?.startsWith('Observation')
      ))
    };
    mockSubscriptionModel.find.mockReturnValue(mockQuery as any);
  });

  describe('Constructor', () => {
    it('should initialize with resource and subscription model', () => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
      
      expect(matches.resource).toBe(mockBloodPressureResource);
      expect(matches['subscriptionModel']).toBe(mockSubscriptionModel);
    });
  });

  describe('findMatchingSubscriptions', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should return matching subscriptions for blood pressure resource', async () => {
      const result = await matches.findMatchingSubscriptions();
      
      expect(result).toHaveLength(3); // Profile, code, and subject matches
      expect(result.map(sub => sub.criteria)).toContain(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
    });

    it('should return empty array when no subscriptions match', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const result = await matches.findMatchingSubscriptions();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('matchesCriteria', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should return false for different resource types', () => {
      const result = matches.matchesCriteria('Patient?active=true');
      
      expect(result).toBe(false);
    });

    it('should return true for matching resource type without parameters', () => {
      const result = matches.matchesCriteria('Observation');
      
      expect(result).toBe(true);
    });

    it('should return true for matching criteria with parameters', () => {
      const result = matches.matchesCriteria(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
      
      expect(result).toBe(true);
    });

    it('should return false for non-matching criteria parameters', () => {
      const result = matches.matchesCriteria(
        'Observation?_profile=http://example.com/other-profile'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('matchProfile', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should match existing profile URL', () => {
      const result = matches['matchProfile'](
        'http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
      
      expect(result).toBe(true);
    });

    it('should not match non-existing profile URL', () => {
      const result = matches['matchProfile'](
        'http://example.com/other-profile'
      );
      
      expect(result).toBe(false);
    });

    it('should return false when meta.profile is undefined', () => {
      const resourceWithoutProfile = { ...mockBloodPressureResource };
      delete (resourceWithoutProfile as any).meta;
      matches = new Matches(resourceWithoutProfile, mockSubscriptionModel);

      const result = matches['matchProfile'](
        'http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('matchCode', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should match existing code value', () => {
      const result = matches['matchCode']('85354-9');
      
      expect(result).toBe(true);
    });

    it('should not match non-existing code value', () => {
      const result = matches['matchCode']('12345-6');
      
      expect(result).toBe(false);
    });

    it('should return false when code is undefined', () => {
      const resourceWithoutCode = { ...mockBloodPressureResource };
      delete (resourceWithoutCode as any).code;
      matches = new Matches(resourceWithoutCode, mockSubscriptionModel);

      const result = matches['matchCode']('85354-9');
      
      expect(result).toBe(false);
    });

    it('should return false when coding array is empty', () => {
      const resourceWithEmptyCodings = {
        ...mockBloodPressureResource,
        code: { coding: [] }
      };
      matches = new Matches(resourceWithEmptyCodings, mockSubscriptionModel);

      const result = matches['matchCode']('85354-9');
      
      expect(result).toBe(false);
    });
  });

  describe('matchSubject', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should match exact subject reference', () => {
      const result = matches['matchSubject']('Patient/123');
      
      expect(result).toBe(true);
    });

    it('should match partial subject reference', () => {
      const result = matches['matchSubject']('123');
      
      expect(result).toBe(true);
    });

    it('should not match different subject reference', () => {
      const result = matches['matchSubject']('Patient/456');
      
      expect(result).toBe(false);
    });

    it('should return false when subject is undefined', () => {
      const resourceWithoutSubject = { ...mockBloodPressureResource };
      delete (resourceWithoutSubject as any).subject;
      matches = new Matches(resourceWithoutSubject, mockSubscriptionModel);

      const result = matches['matchSubject']('Patient/123');
      
      expect(result).toBe(false);
    });
  });

  describe('matchActive', () => {
    beforeEach(() => {
      matches = new Matches(mockPatientResource, mockSubscriptionModel);
    });

    it('should match active=true for active patient', () => {
      const result = matches['matchActive']('true');
      
      expect(result).toBe(true);
    });

    it('should not match active=false for active patient', () => {
      const result = matches['matchActive']('false');
      
      expect(result).toBe(false);
    });

    it('should match active=false for inactive patient', () => {
      const inactivePatient = { ...mockPatientResource, active: false };
      matches = new Matches(inactivePatient, mockSubscriptionModel);
      
      const result = matches['matchActive']('false');
      
      expect(result).toBe(true);
    });

    it('should handle undefined active status', () => {
      const patientWithoutActive = { ...mockPatientResource };
      delete (patientWithoutActive as any).active;
      matches = new Matches(patientWithoutActive, mockSubscriptionModel);
      
      const result = matches['matchActive']('true');
      
      expect(result).toBe(false);
    });
  });

  describe('Patient resource scenarios', () => {
    beforeEach(() => {
      matches = new Matches(mockPatientResource, mockSubscriptionModel);
      
      // Setup mock for Patient subscriptions
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockSubscriptions[2]]) // Patient subscription
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);
    });

    it('should match Patient with active status', () => {
      const result = matches.matchesCriteria('Patient?active=true');
      
      expect(result).toBe(true);
    });

    it('should not match Patient with different status', () => {
      const result = matches.matchesCriteria('Patient?active=false');
      
      expect(result).toBe(false);
    });
  });

  describe('Complex criteria scenarios', () => {
    beforeEach(() => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
    });

    it('should handle multiple parameters (all must match)', () => {
      const resourceWithMultipleAttributes = {
        ...mockBloodPressureResource,
        status: 'final'
      };
      matches = new Matches(resourceWithMultipleAttributes, mockSubscriptionModel);

      const result = matches.matchesCriteria(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure&status=final'
      );
      
      expect(result).toBe(true);
    });

    it('should return false when one of multiple parameters does not match', () => {
      const result = matches.matchesCriteria(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure&status=preliminary'
      );
      
      expect(result).toBe(false);
    });

    it('should handle unknown parameters by returning false', () => {
      const result = matches.matchesCriteria('Observation?unknownParam=value');
      
      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty criteria string', () => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
      
      const result = matches.matchesCriteria('');
      
      expect(result).toBe(false);
    });

    it('should handle malformed criteria', () => {
      matches = new Matches(mockBloodPressureResource, mockSubscriptionModel);
      
      const result = matches.matchesCriteria('InvalidCriteria');
      
      expect(result).toBe(false);
    });

    it('should handle resource without resourceType', () => {
      const invalidResource = { id: 'test' };
      matches = new Matches(invalidResource, mockSubscriptionModel);
      
      const result = matches.matchesCriteria('Observation?status=final');
      
      expect(result).toBe(false);
    });
  });
});