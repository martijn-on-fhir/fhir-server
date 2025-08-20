import {OnEvent} from '@nestjs/event-emitter'
import {Injectable} from '@nestjs/common'
import {ProvenanceBuilder} from "../lib/provenance-builder/provenance-builder";
import {InjectModel} from "@nestjs/mongoose";
import {ProvenanceDocument, ProvenanceResource} from "../schema/provenance-schema";
import {Model} from "mongoose";

export enum FhirEvent {
    CREATED = 'fhir.created',
    UPDATED = 'fhir.updated',
    DELETED = 'fhir.deleted',
    VALIDATED = 'fhir.validated',
    SEARCH = 'fhir.search',
}

@Injectable()
export class FhirEventListener {

    provenanceBuilder: ProvenanceBuilder

    constructor(@InjectModel(ProvenanceResource.name) private provenanceModel: Model<ProvenanceDocument>) {
        this.provenanceBuilder = new ProvenanceBuilder(provenanceModel)
    }

    @OnEvent('fhir.created')
    handleFhirCreatedEvent(payload: any): void {
        this.provenanceBuilder.registerCreateOperation(payload)
    }

    @OnEvent('fhir.updated')
    handleFhirUpdatedEvent(payload: any): void {
        this.provenanceBuilder.registerUpdateOperation(payload)
    }

    @OnEvent('fhir.deleted')
    handleFhirDeletedEvent(payload: any): void {
        this.provenanceBuilder.registerDeleteOperation(payload)
    }

    @OnEvent('fhir.validated')
    handleFhirValidatedEvent(payload: any): void {
        console.log('FHIR resource validated:', payload);
    }

    @OnEvent('fhir.search')
    handleFhirSearchEvent(payload: any): void {
        this.provenanceBuilder.registerSearchOperation(payload)
    }
}
