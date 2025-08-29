import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchesFactory } from './matches-factory';
import { SubscriptionDocument, SubscriptionSchema, SubscriptionStatus } from '../../schema/subscription-schema';
import { SubscriptionEventListener } from '../../events/subscription-event-listener';
import { ResourceChangeEvent } from '../../interfaces/resource-change-event';
import {FsLoggerService} from "../../services/logger/fs-logger.service";

describe('Subscription Matching Integration', () => {
  let matchesFactory: MatchesFactory;
  let eventListener: SubscriptionEventListener;
  let mockSubscriptionModel: jest.Mocked<Model<SubscriptionDocument>>;
    let mockLogger: jest.Mocked<FsLoggerService>;

  const mockBloodPressureSubscription: Partial<SubscriptionDocument> = {
    _id: 'bp-sub-001' as any,
    resourceType: 'Subscription',
    status: SubscriptionStatus.ACTIVE,
    criteria: 'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure',
    channel: {
      type: 'rest-hook',
      endpoint: 'https://example.com/bp-webhook',
      payload: 'application/fhir+json'
    } as any,
    reason: 'Monitor blood pressure readings for cardiac patients',
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  const mockPatientSubscription: Partial<SubscriptionDocument> = {
    _id: 'patient-sub-001' as any,
    resourceType: 'Subscription',
    status: SubscriptionStatus.ACTIVE,
    criteria: 'Patient?active=true',
    channel: {
      type: 'websocket'
    } as any,
    reason: 'Track active patient registrations'
  };

  const mockBloodPressureObservation = {
    resourceType: 'Observation',
    id: 'bp-reading-001',
    meta: {
      profile: ['http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'],
      versionId: '1',
      lastUpdated: new Date().toISOString()
    },
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '85354-9',
        display: 'Blood pressure panel with all children optional'
      }]
    },
    subject: {
      reference: 'Patient/nl-core-patient-cardiac-01'
    },
    effectiveDateTime: new Date().toISOString(),
    component: [
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }]
        },
        valueQuantity: {
          value: 140,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }]
        },
        valueQuantity: {
          value: 90,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    ]
  };

  const mockActivePatient = {
    resourceType: 'Patient',
    id: 'patient-active-001',
    meta: {
      versionId: '2',
      lastUpdated: new Date().toISOString()
    },
    active: true,
    name: [{
      use: 'official',
      family: 'TestPatient',
      given: ['Integration']
    }],
    gender: 'male',
    birthDate: '1985-03-15',
    telecom: [{
      system: 'email',
      value: 'integration.test@example.com'
    }]
  };

  beforeEach(async () => {
    mockSubscriptionModel = {
      find: jest.fn(),
      exec: jest.fn()
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesFactory,
        SubscriptionEventListener,
        {
          provide: getModelToken(SubscriptionSchema.name),
          useValue: mockSubscriptionModel
        },
        {
          provide: FsLoggerService,
          useValue: mockLogger
        }
      ],
    }).compile();

    matchesFactory = module.get<MatchesFactory>(MatchesFactory);
    eventListener = module.get<SubscriptionEventListener>(SubscriptionEventListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Blood Pressure Monitoring', () => {
    it('should match blood pressure observations to subscriptions', async () => {
      // Setup: Mock database returns blood pressure subscription
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockBloodPressureSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      // Create matcher for blood pressure observation
      const matcher = matchesFactory.create(mockBloodPressureObservation);
      
      // Test: Find matching subscriptions
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: Database query was optimized
      expect(mockSubscriptionModel.find).toHaveBeenCalledWith({
        status: SubscriptionStatus.ACTIVE,
        criteria: new RegExp('^Observation(?:\\?|$)', 'i'),
        $or: [
          { end: { $exists: false } },
          { end: { $gt: expect.any(Date) } }
        ]
      });

      // Verify: Blood pressure subscription matches
      expect(matchingSubscriptions).toHaveLength(1);
      expect(matchingSubscriptions[0].criteria).toBe(
        'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
      );
    });

    it('should process blood pressure creation event end-to-end', async () => {
      // Setup: Mock database returns matching subscription
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockBloodPressureSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const createEvent: ResourceChangeEvent = {
        eventType: 'create',
        resourceType: 'Observation',
        resourceId: 'bp-reading-001',
        resource: mockBloodPressureObservation
      };

      // Test: Process creation event
      await eventListener.handleResourceCreatedEvent(createEvent);

      // Verify: Correct logging output
      expect(mockLogger.log).toHaveBeenCalledWith('Resource Observation/bp-reading-001 created');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Found 1 matching subscriptions:',
        'Subscription Eventlistener'
      );
    });
  });

  describe('Patient Registration Monitoring', () => {
    it('should match active patients to subscriptions', async () => {
      // Setup: Mock database returns patient subscription
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockPatientSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockActivePatient);
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: Patient subscription matches
      expect(matchingSubscriptions).toHaveLength(1);
      expect(matchingSubscriptions[0].criteria).toBe('Patient?active=true');
    });

    it('should not match inactive patients', async () => {
      const inactivePatient = { ...mockActivePatient, active: false };
      
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockPatientSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(inactivePatient);
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: No matches for inactive patient
      expect(matchingSubscriptions).toHaveLength(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should efficiently filter subscriptions at database level', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([
          mockBloodPressureSubscription,
          { ...mockBloodPressureSubscription, criteria: 'Observation?code=85354-9' },
          { ...mockBloodPressureSubscription, criteria: 'Observation?status=final' }
        ])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockBloodPressureObservation);
      await matcher.findMatchingSubscriptions();

      // Verify: Database query uses efficient regex filter
      expect(mockSubscriptionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            source: '^Observation(?:\\?|$)',
            flags: 'i'
          })
        })
      );
    });

    it('should handle multiple resource types without interference', async () => {
      // Setup different subscriptions for different resource types
      const observationQuery = {
        exec: jest.fn().mockResolvedValue([mockBloodPressureSubscription])
      };
      const patientQuery = {
        exec: jest.fn().mockResolvedValue([mockPatientSubscription])
      };

      mockSubscriptionModel.find
        .mockReturnValueOnce(observationQuery as any)
        .mockReturnValueOnce(patientQuery as any);

      // Test: Process both resource types
      const observationMatcher = matchesFactory.create(mockBloodPressureObservation);
      const patientMatcher = matchesFactory.create(mockActivePatient);

      const [obsMatches, patientMatches] = await Promise.all([
        observationMatcher.findMatchingSubscriptions(),
        patientMatcher.findMatchingSubscriptions()
      ]);

      // Verify: Each resource type finds its appropriate subscriptions
      expect(obsMatches).toHaveLength(1);
      expect(obsMatches[0].criteria).toContain('Observation?');
      
      expect(patientMatches).toHaveLength(1);
      expect(patientMatches[0].criteria).toContain('Patient?');

      // Verify: Separate database queries for each resource type
      expect(mockSubscriptionModel.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complex Criteria Matching', () => {
    it('should handle multiple parameters in subscription criteria', async () => {
      const complexSubscription = {
        ...mockBloodPressureSubscription,
        criteria: 'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure&status=final'
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue([complexSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockBloodPressureObservation);
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: Complex criteria matches
      expect(matchingSubscriptions).toHaveLength(1);
      expect(matchingSubscriptions[0].criteria).toContain('_profile=');
      expect(matchingSubscriptions[0].criteria).toContain('status=final');
    });

    it('should reject partial matches for multiple parameters', async () => {
      const partialMatchSubscription = {
        ...mockBloodPressureSubscription,
        criteria: 'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure&status=preliminary'
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue([partialMatchSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockBloodPressureObservation); // status is 'final', not 'preliminary'
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: No matches when all parameters don't match
      expect(matchingSubscriptions).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty subscription results gracefully', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockBloodPressureObservation);
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      expect(matchingSubscriptions).toHaveLength(0);
    });

    it('should handle resources without required fields', async () => {
      const incompleteResource = {
        resourceType: 'Observation',
        id: 'incomplete-001'
        // Missing meta, status, code, etc.
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockBloodPressureSubscription])
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(incompleteResource);
      const matchingSubscriptions = await matcher.findMatchingSubscriptions();

      // Verify: Resource without profile doesn't match profile-based subscription
      expect(matchingSubscriptions).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };
      mockSubscriptionModel.find.mockReturnValue(mockQuery as any);

      const matcher = matchesFactory.create(mockBloodPressureObservation);

      await expect(matcher.findMatchingSubscriptions()).rejects.toThrow('Database connection failed');
    });
  });
});