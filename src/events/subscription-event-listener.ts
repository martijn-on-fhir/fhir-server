import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";

export enum ResourceEvent {
    CREATED = 'resource.created',
    UPDATED = 'resource.updated',
    DELETED = 'resource.deleted'
}

@Injectable()
export class SubscriptionEventListener {

    @OnEvent('resource.created')
    handleResourceCreatedEvent(payload: ResourceEvent): void {
        console.log(payload);
    }

    @OnEvent('resource.updated')
    handleResourceUpdatedEvent(payload: ResourceEvent): void {
        console.log(payload)
    }

    @OnEvent('resource.deleted')
    handleResourceDeletedEvent(payload: ResourceEvent): void {
        console.log(payload)
    }
}