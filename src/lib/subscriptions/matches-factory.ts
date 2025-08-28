import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, SubscriptionSchema } from '../../schema/subscription-schema';
import { Matches } from './matches';

/**
 * Factory service for creating subscription matcher instances
 */
@Injectable()
export class MatchesFactory {
    /**
     * Initializes factory with subscription model dependency
     * @param subscriptionModel Injected Mongoose subscription model
     */
    constructor(
        @InjectModel(SubscriptionSchema.name) private subscriptionModel: Model<SubscriptionDocument>
    ) {}

    /**
     * Creates a new matcher instance for the given FHIR resource
     * @param resource FHIR resource to create matcher for
     * @returns Configured Matches instance ready for subscription matching
     */
    create(resource: Record<string, unknown>): Matches {
        return new Matches(resource, this.subscriptionModel);
    }
}