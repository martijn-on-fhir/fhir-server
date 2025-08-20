import {OnEvent} from '@nestjs/event-emitter'
import {Injectable} from '@nestjs/common'

export enum FhirEvent {
    CREATED = 'fhir.created',
    UPDATED = 'fhir.updated',
    DELETED = 'fhir.deleted',
    VALIDATED = 'fhir.validated',
    SEARCH = 'fhir.search',
}

@Injectable()
export class FhirEventListener {

    @OnEvent('fhir.created')
    handleFhirCreatedEvent(payload: any): void {
        console.log('FHIR resource created:', payload);
    }

    @OnEvent('fhir.updated')
    handleFhirUpdatedEvent(payload: any): void {
        console.log('FHIR resource updated:', payload);
    }

    @OnEvent('fhir.deleted')
    handleFhirDeletedEvent(payload: any): void {
        console.log('FHIR resource deleted:', payload);
    }

    @OnEvent('fhir.validated')
    handleFhirValidatedEvent(payload: any): void {
        console.log('FHIR resource validated:', payload);
    }

    @OnEvent('fhir.search')
    handleFhirSearchEvent(payload: any): void {
        console.log('FHIR resource searched:', payload);
    }
}
