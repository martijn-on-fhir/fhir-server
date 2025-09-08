import {Test, TestingModule} from '@nestjs/testing';
import {getModelToken} from '@nestjs/mongoose';
import {ConfigService} from '@nestjs/config';
import {FhirEventListener} from "./fhir-event-listener";
import {ProvenanceResource} from "../schema/provenance-schema";

describe('FhirEventListener', () => {

    let service: FhirEventListener;
    let mockProvenanceModel: any;
    let mockConfigService: jest.Mocked<ConfigService>;
    let module: TestingModule;

    const createTestModule = async (provenanceEnabled: boolean = false): Promise<TestingModule> => {
        // Create mock for the Mongoose model
        mockProvenanceModel = {
            save: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            deleteOne: jest.fn(),
            updateOne: jest.fn(),
        };

        // Create mock ConfigService
        mockConfigService = {
            get: jest.fn().mockReturnValue(provenanceEnabled)
        } as any;

        const testModule: TestingModule = await Test.createTestingModule({
            providers: [
                FhirEventListener,
                {provide: getModelToken(ProvenanceResource.name), useValue: mockProvenanceModel},
                {provide: ConfigService, useValue: mockConfigService}
            ],
        }).compile();

        return testModule;
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Initialization', () => {
        describe('when provenance is enabled', () => {
            beforeEach(async () => {
                module = await createTestModule(true);
                service = module.get<FhirEventListener>(FhirEventListener);
            });

            it('should be defined', () => {
                expect(service).toBeDefined();
            });

            it('should create ProvenanceBuilder instance', () => {
                expect(service.provenanceBuilder).toBeDefined();
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
            });

            it('should call configService.get during initialization', () => {
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
            });
        });

        describe('when provenance is disabled', () => {
            beforeEach(async () => {
                module = await createTestModule(false);
                service = module.get<FhirEventListener>(FhirEventListener);
            });

            it('should be defined', () => {
                expect(service).toBeDefined();
            });

            it('should not create ProvenanceBuilder instance', () => {
                expect(service.provenanceBuilder).toBeUndefined();
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
            });
        });
    });

    describe('Event Handlers - Provenance Enabled', () => {
        beforeEach(async () => {
            module = await createTestModule(true);
            service = module.get<FhirEventListener>(FhirEventListener);
        });

        describe('handleFhirCreatedEvent', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should call register with "create" for basic payload', () => {
                const payload = {id: '123', resourceType: 'Patient'};
                service.handleFhirCreatedEvent(payload);
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'create');
            });

            it('should call register with "create" for complex payload', () => {
                const payload = {
                    resourceType: 'Patient',
                    resourceId: 'patient-123',
                    resource: {
                        resourceType: 'Patient',
                        id: 'patient-123',
                        active: true,
                        name: [{family: 'Doe', given: ['John']}]
                    },
                    request: {method: 'POST', url: '/Patient'},
                    user: {id: 'user-456'}
                };
                service.handleFhirCreatedEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'create');
            });

            it('should handle null payload gracefully', () => {
                expect(() => service.handleFhirCreatedEvent(null)).not.toThrow();
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(null, 'create');
            });
        });

        describe('handleFhirUpdatedEvent', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should call register with "update" for basic payload', () => {
                const payload = {id: '456', resourceType: 'Observation'};
                service.handleFhirUpdatedEvent(payload);
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'update');
            });

            it('should call register with "update" for payload with previous resource', () => {
                const payload = {
                    resourceType: 'Observation',
                    resourceId: 'obs-456',
                    resource: {
                        resourceType: 'Observation',
                        id: 'obs-456',
                        status: 'final'
                    },
                    previousResource: {
                        resourceType: 'Observation',
                        id: 'obs-456',
                        status: 'preliminary'
                    }
                };
                service.handleFhirUpdatedEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'update');
            });
        });

        describe('handleFhirDeletedEvent', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should call register with "delete" for basic payload', () => {
                const payload = {id: '789', resourceType: 'Encounter'};
                service.handleFhirDeletedEvent(payload);
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'delete');
            });

            it('should call register with "delete" for complete payload', () => {
                const payload = {
                    resourceType: 'Encounter',
                    resourceId: 'enc-789',
                    resource: {
                        resourceType: 'Encounter',
                        id: 'enc-789',
                        status: 'finished'
                    },
                    request: {method: 'DELETE', url: '/Encounter/enc-789'}
                };
                service.handleFhirDeletedEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'delete');
            });
        });

        describe('handleFhirReadEvent', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should call register with "read" for basic payload', () => {
                const payload = {id: '101', resourceType: 'Condition'};
                service.handleFhirReadEvent(payload);
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'read');
            });

            it('should call register with "read" for detailed payload', () => {
                const payload = {
                    resourceType: 'Condition',
                    resourceId: 'condition-101',
                    resource: {
                        resourceType: 'Condition',
                        id: 'condition-101',
                        clinicalStatus: {coding: [{code: 'active'}]}
                    },
                    request: {method: 'GET', url: '/Condition/condition-101'},
                    user: {id: 'practitioner-123'}
                };
                service.handleFhirReadEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'read');
            });
        });

        describe('handleFhirSearchEvent', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should call register with "execute" for basic search', () => {
                const payload = {resourceType: 'MedicationRequest'};
                service.handleFhirSearchEvent(payload);
                expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'execute');
            });

            it('should call register with "execute" for complex search', () => {
                const payload = {
                    resourceType: 'MedicationRequest',
                    searchParameters: {
                        patient: 'Patient/123',
                        status: 'active',
                        _count: 20
                    },
                    results: {
                        total: 5,
                        entry: []
                    },
                    request: {method: 'GET', url: '/MedicationRequest?patient=Patient/123&status=active'}
                };
                service.handleFhirSearchEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'execute');
            });

            it('should handle empty search payload', () => {
                const payload = {};
                service.handleFhirSearchEvent(payload);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(payload, 'execute');
            });
        });

        describe('Error Handling', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation(() => {
                    throw new Error('ProvenanceBuilder error');
                });
            });

            it('should propagate error when ProvenanceBuilder fails in create event', () => {
                const payload = {id: '123', resourceType: 'Patient'};
                expect(() => service.handleFhirCreatedEvent(payload)).toThrow('ProvenanceBuilder error');
            });

            it('should propagate error when ProvenanceBuilder fails in update event', () => {
                const payload = {id: '456', resourceType: 'Observation'};
                expect(() => service.handleFhirUpdatedEvent(payload)).toThrow('ProvenanceBuilder error');
            });

            it('should propagate error when ProvenanceBuilder fails in delete event', () => {
                const payload = {id: '789', resourceType: 'Encounter'};
                expect(() => service.handleFhirDeletedEvent(payload)).toThrow('ProvenanceBuilder error');
            });

            it('should propagate error when ProvenanceBuilder fails in read event', () => {
                const payload = {id: '101', resourceType: 'Condition'};
                expect(() => service.handleFhirReadEvent(payload)).toThrow('ProvenanceBuilder error');
            });

            it('should propagate error when ProvenanceBuilder fails in search event', () => {
                const payload = {resourceType: 'MedicationRequest'};
                expect(() => service.handleFhirSearchEvent(payload)).toThrow('ProvenanceBuilder error');
            });
        });

        describe('Integration Scenarios', () => {
            beforeEach(() => {
                jest.spyOn(service.provenanceBuilder, 'register').mockImplementation();
            });

            it('should handle multiple events in sequence', () => {
                const createPayload = {id: '1', resourceType: 'Patient'};
                const updatePayload = {id: '1', resourceType: 'Patient', version: 2};
                const readPayload = {id: '1', resourceType: 'Patient'};
                const deletePayload = {id: '1', resourceType: 'Patient'};

                service.handleFhirCreatedEvent(createPayload);
                service.handleFhirUpdatedEvent(updatePayload);
                service.handleFhirReadEvent(readPayload);
                service.handleFhirDeletedEvent(deletePayload);

                expect(service.provenanceBuilder.register).toHaveBeenCalledTimes(4);
                expect(service.provenanceBuilder.register).toHaveBeenNthCalledWith(1, createPayload, 'create');
                expect(service.provenanceBuilder.register).toHaveBeenNthCalledWith(2, updatePayload, 'update');
                expect(service.provenanceBuilder.register).toHaveBeenNthCalledWith(3, readPayload, 'read');
                expect(service.provenanceBuilder.register).toHaveBeenNthCalledWith(4, deletePayload, 'delete');
            });

            it('should handle different resource types', () => {
                const patientPayload = {id: '1', resourceType: 'Patient'};
                const observationPayload = {id: '2', resourceType: 'Observation'};
                const encounterPayload = {id: '3', resourceType: 'Encounter'};

                service.handleFhirCreatedEvent(patientPayload);
                service.handleFhirCreatedEvent(observationPayload);
                service.handleFhirCreatedEvent(encounterPayload);

                expect(service.provenanceBuilder.register).toHaveBeenCalledTimes(3);
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(patientPayload, 'create');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(observationPayload, 'create');
                expect(service.provenanceBuilder.register).toHaveBeenCalledWith(encounterPayload, 'create');
            });
        });
    });

    describe('Event Handlers - Provenance Disabled', () => {
        beforeEach(async () => {
            module = await createTestModule(false);
            service = module.get<FhirEventListener>(FhirEventListener);
        });

        it('should not call register when handling created event and provenance is disabled', () => {
            const payload = {id: '123', resourceType: 'Patient'};
            expect(() => service.handleFhirCreatedEvent(payload)).not.toThrow();
            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });

        it('should not call register when handling updated event and provenance is disabled', () => {
            const payload = {id: '456', resourceType: 'Observation'};
            expect(() => service.handleFhirUpdatedEvent(payload)).not.toThrow();
            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });

        it('should not call register when handling deleted event and provenance is disabled', () => {
            const payload = {id: '789', resourceType: 'Encounter'};
            expect(() => service.handleFhirDeletedEvent(payload)).not.toThrow();
            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });

        it('should not call register when handling read event and provenance is disabled', () => {
            const payload = {id: '101', resourceType: 'Condition'};
            expect(() => service.handleFhirReadEvent(payload)).not.toThrow();
            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });

        it('should not call register when handling search event and provenance is disabled', () => {
            const payload = {resourceType: 'MedicationRequest'};
            expect(() => service.handleFhirSearchEvent(payload)).not.toThrow();
            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });

        it('should handle all events when provenance disabled without errors', () => {
            const payloads = [
                {id: '1', resourceType: 'Patient'},
                {id: '2', resourceType: 'Observation'},
                {id: '3', resourceType: 'Encounter'}
            ];

            expect(() => {
                payloads.forEach(payload => {
                    service.handleFhirCreatedEvent(payload);
                    service.handleFhirUpdatedEvent(payload);
                    service.handleFhirReadEvent(payload);
                    service.handleFhirDeletedEvent(payload);
                    service.handleFhirSearchEvent(payload);
                });
            }).not.toThrow();

            expect(mockConfigService.get).toHaveBeenCalledWith('authorization.provenance.enabled');
        });
    });
});