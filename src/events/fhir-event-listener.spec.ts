import {Test, TestingModule} from '@nestjs/testing';
import {getModelToken} from '@nestjs/mongoose';
import {FhirEventListener} from "./fhir-event-listener";
import {ProvenanceBuilder} from "../lib/provenance-builder/provenance-builder";
import {ProvenanceResource} from "../schema/provenance-schema";

describe('FhirEventListener', () => {

    let service: FhirEventListener;
    let mockProvenanceModel: any;
    let mockProvenanceBuilder: ProvenanceBuilder;

    beforeEach(async () => {
        mockProvenanceModel = {
            save: jest.fn()
        };
        mockProvenanceBuilder = {
            register: jest.fn()
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FhirEventListener,
                {provide: getModelToken(ProvenanceResource.name), useValue: mockProvenanceModel}
            ],
        }).compile();

        service = module.get<FhirEventListener>(FhirEventListener);
        (service as any).provenanceBuilder = mockProvenanceBuilder;
    });

    describe('handleFhirCreatedEvent', () => {
        it('should call register with "create"', () => {
            const payload = {id: '123', resourceType: 'Patient'};
            service.handleFhirCreatedEvent(payload);
            expect(mockProvenanceBuilder.register).toHaveBeenCalledWith(payload, 'create');
        });
    });

    describe('handleFhirUpdatedEvent', () => {
        it('should call register with "update"', () => {
            const payload = {id: '456', resourceType: 'Observation'};
            service.handleFhirUpdatedEvent(payload);
            expect(mockProvenanceBuilder.register).toHaveBeenCalledWith(payload, 'update');
        });
    });

    describe('handleFhirDeletedEvent', () => {
        it('should call register with "delete"', () => {
            const payload = {id: '789', resourceType: 'Encounter'};
            service.handleFhirDeletedEvent(payload);
            expect(mockProvenanceBuilder.register).toHaveBeenCalledWith(payload, 'delete');
        });
    });

    describe('handleFhirReadEvent', () => {
        it('should call register with "read"', () => {
            const payload = {id: '101', resourceType: 'Condition'};
            service.handleFhirReadEvent(payload);
            expect(mockProvenanceBuilder.register).toHaveBeenCalledWith(payload, 'read');
        });
    });

    describe('handleFhirSearchEvent', () => {
        it('should call register with "execute"', () => {
            const payload = {resourceType: 'MedicationRequest'};
            service.handleFhirSearchEvent(payload);
            expect(mockProvenanceBuilder.register).toHaveBeenCalledWith(payload, 'execute');
        });
    });
});