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
    READ = 'fhir.read',
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
        this.provenanceBuilder.register(payload, 'create')
    }

    @OnEvent('fhir.updated')
    handleFhirUpdatedEvent(payload: any): void {
        this.provenanceBuilder.register(payload,'update')
    }

    @OnEvent('fhir.deleted')
    handleFhirDeletedEvent(payload: any): void {
        this.provenanceBuilder.register(payload, 'delete')
    }

    @OnEvent('fhir.read')
    handleFhirReadEvent(payload: any): void {
        this.provenanceBuilder.register(payload, 'read')
    }

    @OnEvent('fhir.search')
    handleFhirSearchEvent(payload: any): void {
        this.provenanceBuilder.register(payload, 'execute')
    }
}
