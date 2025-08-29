import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SubscriptionEventListener } from './subscription-event-listener';
import { MatchesFactory } from '../lib/subscriptions/matches-factory';
import { FsLoggerService } from '../services/logger/fs-logger.service';
import { ResourceChangeEvent } from '../interfaces/resource-change-event';
import { Matches } from '../lib/subscriptions/matches';
import { SubscriptionSchema } from '../schema/subscription-schema';

describe('SubscriptionEventListener', () => {
    let service: SubscriptionEventListener;
    let mockMatchesFactory: jest.Mocked<MatchesFactory>;
    let mockLogger: jest.Mocked<FsLoggerService>;
    let mockMatches: jest.Mocked<Matches>;

    beforeEach(async () => {
        // Create mock Matches instance
        mockMatches = {
            findMatchingSubscriptions: jest.fn()
        } as any;

        // Create mock MatchesFactory
        mockMatchesFactory = {
            create: jest.fn().mockReturnValue(mockMatches)
        } as any;

        // Create mock FsLoggerService
        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        } as any;

        // Create mock subscription model
        const mockSubscriptionModel = {
            find: jest.fn(),
            exec: jest.fn()
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionEventListener,
                MatchesFactory,
                { provide: getModelToken(SubscriptionSchema.name), useValue: mockSubscriptionModel },
                { provide: FsLoggerService, useValue: mockLogger }
            ],
        }).compile();

        service = module.get<SubscriptionEventListener>(SubscriptionEventListener);
        
        // Replace the MatchesFactory instance with our mock
        const matchesFactory = module.get<MatchesFactory>(MatchesFactory);
        jest.spyOn(matchesFactory, 'create').mockImplementation(mockMatchesFactory.create);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('handleResourceCreatedEvent', () => {
        it('should process created resource and find matching subscriptions', async () => {
            const mockSubscriptions = [
                { id: 'sub1', criteria: 'Patient?status=active' },
                { id: 'sub2', criteria: 'Patient?gender=male' }
            ];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-123',
                resource: {
                    resourceType: 'Patient',
                    id: 'patient-123',
                    active: true,
                    gender: 'male'
                }
            };

            await service.handleResourceCreatedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.resource);
            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('Resource Patient/patient-123 created');
            expect(mockLogger.log).toHaveBeenCalledWith('Found 2 matching subscriptions:', 'Subscription Eventlistener');
        });

        it('should handle payload without resource gracefully', async () => {
            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-123'
            };

            await service.handleResourceCreatedEvent(payload);

            expect(mockMatchesFactory.create).not.toHaveBeenCalled();
            expect(mockMatches.findMatchingSubscriptions).not.toHaveBeenCalled();
            expect(mockLogger.log).not.toHaveBeenCalled();
        });

        it('should handle empty matching subscriptions', async () => {
            mockMatches.findMatchingSubscriptions.mockResolvedValue([]);

            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Observation',
                resourceId: 'obs-456',
                resource: {
                    resourceType: 'Observation',
                    id: 'obs-456',
                    status: 'final'
                }
            };

            await service.handleResourceCreatedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.resource);
            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('Resource Observation/obs-456 created');
            expect(mockLogger.log).toHaveBeenCalledWith('Found 0 matching subscriptions:', 'Subscription Eventlistener');
        });

        it('should handle errors from findMatchingSubscriptions', async () => {
            mockMatches.findMatchingSubscriptions.mockRejectedValue(new Error('Database error'));

            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-123',
                resource: {
                    resourceType: 'Patient',
                    id: 'patient-123'
                }
            };

            await expect(service.handleResourceCreatedEvent(payload)).rejects.toThrow('Database error');
            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.resource);
        });
    });

    describe('handleResourceUpdatedEvent', () => {
        it('should process updated resource and find matching subscriptions', async () => {
            const mockSubscriptions = [{ id: 'sub1', criteria: 'Encounter?status=finished' }];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'update',
                resourceType: 'Encounter',
                resourceId: 'enc-789',
                resource: {
                    resourceType: 'Encounter',
                    id: 'enc-789',
                    status: 'finished'
                },
                previousResource: {
                    resourceType: 'Encounter',
                    id: 'enc-789',
                    status: 'in-progress'
                }
            };

            await service.handleResourceUpdatedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.resource);
            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('Resource Encounter/enc-789 updated');
            expect(mockLogger.log).toHaveBeenCalledWith('Found 1 matching subscriptions:', 'Subscription Eventlistener');
        });

        it('should handle payload without resource gracefully', async () => {
            const payload: ResourceChangeEvent = {
                eventType: 'update',
                resourceType: 'Encounter',
                resourceId: 'enc-789'
            };

            await service.handleResourceUpdatedEvent(payload);

            expect(mockMatchesFactory.create).not.toHaveBeenCalled();
            expect(mockMatches.findMatchingSubscriptions).not.toHaveBeenCalled();
            expect(mockLogger.log).not.toHaveBeenCalled();
        });

        it('should handle multiple matching subscriptions', async () => {
            const mockSubscriptions = [
                { id: 'sub1', criteria: 'Patient?active=true' },
                { id: 'sub2', criteria: 'Patient?name=John' },
                { id: 'sub3', criteria: 'Patient' }
            ];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'update',
                resourceType: 'Patient',
                resourceId: 'patient-456',
                resource: {
                    resourceType: 'Patient',
                    id: 'patient-456',
                    active: true,
                    name: [{ given: ['John'] }]
                }
            };

            await service.handleResourceUpdatedEvent(payload);

            expect(mockLogger.log).toHaveBeenCalledWith('Found 3 matching subscriptions:', 'Subscription Eventlistener');
        });
    });

    describe('handleResourceDeletedEvent', () => {
        it('should process deleted resource using previousResource for matching', async () => {
            const mockSubscriptions = [{ id: 'sub1', criteria: 'Condition?clinicalStatus=resolved' }];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'delete',
                resourceType: 'Condition',
                resourceId: 'condition-101',
                previousResource: {
                    resourceType: 'Condition',
                    id: 'condition-101',
                    clinicalStatus: { coding: [{ code: 'resolved' }] }
                }
            };

            await service.handleResourceDeletedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.previousResource);
            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('Resource Condition/condition-101 deleted');
            expect(mockLogger.log).toHaveBeenCalledWith('Found 1 matching subscriptions:', 'Subscription Eventlistener');
        });

        it('should fallback to resource if previousResource not available', async () => {
            const mockSubscriptions = [{ id: 'sub1', criteria: 'MedicationRequest' }];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'delete',
                resourceType: 'MedicationRequest',
                resourceId: 'medreq-202',
                resource: {
                    resourceType: 'MedicationRequest',
                    id: 'medreq-202',
                    status: 'cancelled'
                }
            };

            await service.handleResourceDeletedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.resource);
            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalled();
            expect(mockLogger.log).toHaveBeenCalledWith('Resource MedicationRequest/medreq-202 deleted');
        });

        it('should handle payload without resource or previousResource gracefully', async () => {
            const payload: ResourceChangeEvent = {
                eventType: 'delete',
                resourceType: 'Condition',
                resourceId: 'condition-101'
            };

            await service.handleResourceDeletedEvent(payload);

            expect(mockMatchesFactory.create).not.toHaveBeenCalled();
            expect(mockMatches.findMatchingSubscriptions).not.toHaveBeenCalled();
            expect(mockLogger.log).not.toHaveBeenCalled();
        });

        it('should prefer previousResource over resource when both exist', async () => {
            const mockSubscriptions = [];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const payload: ResourceChangeEvent = {
                eventType: 'delete',
                resourceType: 'DiagnosticReport',
                resourceId: 'report-303',
                resource: {
                    resourceType: 'DiagnosticReport',
                    id: 'report-303',
                    status: 'final'
                },
                previousResource: {
                    resourceType: 'DiagnosticReport',
                    id: 'report-303',
                    status: 'preliminary'
                }
            };

            await service.handleResourceDeletedEvent(payload);

            expect(mockMatchesFactory.create).toHaveBeenCalledWith(payload.previousResource);
            expect(mockMatchesFactory.create).not.toHaveBeenCalledWith(payload.resource);
        });
    });

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            mockMatches.findMatchingSubscriptions.mockClear();
        });

        it('should handle sequence of events for same resource', async () => {
            const mockSubscriptions = [{ id: 'sub1', criteria: 'Patient' }];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const baseResource = {
                resourceType: 'Patient',
                id: 'patient-seq',
                active: true
            };

            const createPayload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-seq',
                resource: baseResource
            };

            const updatePayload: ResourceChangeEvent = {
                eventType: 'update',
                resourceType: 'Patient',
                resourceId: 'patient-seq',
                resource: { ...baseResource, active: false },
                previousResource: baseResource
            };

            const deletePayload: ResourceChangeEvent = {
                eventType: 'delete',
                resourceType: 'Patient',
                resourceId: 'patient-seq',
                previousResource: { ...baseResource, active: false }
            };

            await service.handleResourceCreatedEvent(createPayload);
            await service.handleResourceUpdatedEvent(updatePayload);
            await service.handleResourceDeletedEvent(deletePayload);

            expect(mockMatches.findMatchingSubscriptions).toHaveBeenCalledTimes(3);
            expect(mockLogger.log).toHaveBeenCalledTimes(6); // 2 calls per event
        });

        it('should handle different resource types', async () => {
            const mockSubscriptions = [{ id: 'sub1', criteria: 'Patient' }];
            mockMatches.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);

            const patientPayload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-1',
                resource: { resourceType: 'Patient', id: 'patient-1' }
            };

            const observationPayload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Observation',
                resourceId: 'obs-1',
                resource: { resourceType: 'Observation', id: 'obs-1' }
            };

            const encounterPayload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Encounter',
                resourceId: 'enc-1',
                resource: { resourceType: 'Encounter', id: 'enc-1' }
            };

            await service.handleResourceCreatedEvent(patientPayload);
            await service.handleResourceCreatedEvent(observationPayload);
            await service.handleResourceCreatedEvent(encounterPayload);

            expect(mockMatchesFactory.create).toHaveBeenCalledTimes(3);
            expect(mockMatchesFactory.create).toHaveBeenCalledWith(patientPayload.resource);
            expect(mockMatchesFactory.create).toHaveBeenCalledWith(observationPayload.resource);
            expect(mockMatchesFactory.create).toHaveBeenCalledWith(encounterPayload.resource);
        });
    });

    describe('Error Handling', () => {
        it('should propagate MatchesFactory creation errors', async () => {
            mockMatchesFactory.create.mockImplementation(() => {
                throw new Error('MatchesFactory error');
            });

            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-error',
                resource: { resourceType: 'Patient', id: 'patient-error' }
            };

            await expect(service.handleResourceCreatedEvent(payload)).rejects.toThrow('MatchesFactory error');
        });

        it('should handle async errors from findMatchingSubscriptions in all event types', async () => {
            const error = new Error('Subscription matching failed');
            mockMatches.findMatchingSubscriptions.mockRejectedValue(error);

            const payload: ResourceChangeEvent = {
                eventType: 'create',
                resourceType: 'Patient',
                resourceId: 'patient-async-error',
                resource: { resourceType: 'Patient', id: 'patient-async-error' }
            };

            await expect(service.handleResourceCreatedEvent(payload)).rejects.toThrow('Subscription matching failed');
            await expect(service.handleResourceUpdatedEvent(payload)).rejects.toThrow('Subscription matching failed');

            const deletePayload = { ...payload, eventType: 'delete' as const, previousResource: payload.resource };
            await expect(service.handleResourceDeletedEvent(deletePayload)).rejects.toThrow('Subscription matching failed');
        });
    });
});