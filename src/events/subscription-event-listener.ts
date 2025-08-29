import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {MatchesFactory} from "../lib/subscriptions/matches-factory";
import {ResourceChangeEvent} from "../interfaces/resource-change-event";
import {FsLoggerService} from "../services/logger/fs-logger.service";

export enum ResourceEvent {
    CREATED = 'resource.created',
    UPDATED = 'resource.updated',
    DELETED = 'resource.deleted'
}

/**
 * Event listener that processes FHIR resource changes for subscription matching
 */
@Injectable()
export class SubscriptionEventListener {

    /**
     * Initializes listener with matches factory dependency
     * @param matchesFactory Factory for creating subscription matchers
     */
    constructor(private matchesFactory: MatchesFactory, private readonly logger: FsLoggerService) {}

    /**
     * Handles resource creation events and finds matching subscriptions
     * @param payload Event payload containing created resource data
     */
    @OnEvent('resource.created')
    async handleResourceCreatedEvent(payload: ResourceChangeEvent): Promise<void> {

        if(!payload.resource) return;

        const matcher = this.matchesFactory.create(payload.resource);
        const matchingSubscriptions = await matcher.findMatchingSubscriptions();
        
        this.logger.log(`Resource ${payload.resourceType}/${payload.resource.id} created`);
        this.logger.log(`Found ${matchingSubscriptions.length} matching subscriptions:`, 'Subscription Eventlistener')
    }

    /**
     * Handles resource update events and finds matching subscriptions
     * @param payload Event payload containing updated resource data
     */
    @OnEvent('resource.updated')
    async handleResourceUpdatedEvent(payload: ResourceChangeEvent): Promise<void> {

        if(!payload.resource) return;

        const matcher = this.matchesFactory.create(payload.resource);
        const matchingSubscriptions = await matcher.findMatchingSubscriptions();
        
        this.logger.log(`Resource ${payload.resourceType}/${payload.resourceId} updated`);
        this.logger.log(`Found ${matchingSubscriptions.length} matching subscriptions:`,'Subscription Eventlistener');
    }

    /**
     * Handles resource deletion events using previous resource state for matching
     * @param payload Event payload, uses previousResource for subscription matching
     */
    @OnEvent('resource.deleted')
    async handleResourceDeletedEvent(payload: ResourceChangeEvent): Promise<void> {
        // For deleted resources, we might want to check against previousResource
        const resourceToCheck = payload.previousResource || payload.resource;
        if(!resourceToCheck) return;

        const matcher = this.matchesFactory.create(resourceToCheck);
        const matchingSubscriptions = await matcher.findMatchingSubscriptions();
        
        this.logger.log(`Resource ${payload.resourceType}/${payload.resourceId} deleted`);
        this.logger.log(`Found ${matchingSubscriptions.length} matching subscriptions:`,'Subscription Eventlistener')
    }
}