import {Model} from 'mongoose';
import {SubscriptionDocument, SubscriptionStatus} from '../../schema/subscription-schema';

/**
 * Handles subscription matching logic for FHIR resources
 */
export class Matches {

    /** The FHIR resource to match against subscriptions */
    resource: Record<string, unknown>

    /** Mongoose model for subscription queries */
    private subscriptionModel: Model<SubscriptionDocument>

    /**
     * Creates a new matcher for the given resource
     * @param resource FHIR resource to match against subscriptions
     * @param subscriptionModel Mongoose model for subscription queries
     */
    constructor(
        resource: Record<string, unknown>,
        subscriptionModel: Model<SubscriptionDocument>
    ) {
        this.resource = resource
        this.subscriptionModel = subscriptionModel
    }

    /**
     * Finds all active subscriptions that match the resource
     * @returns Array of matching subscription documents
     */
    async findMatchingSubscriptions(): Promise<SubscriptionDocument[]> {

        const resourceType = this.resource.resourceType as string;
        
        // Get active subscriptions for this resource type
        const activeSubscriptions = await this.subscriptionModel.find({
            status: SubscriptionStatus.ACTIVE,
            criteria: new RegExp(`^${resourceType}(?:\\?|$)`, 'i'),
            $or: [
                { end: { $exists: false } },
                { end: { $gt: new Date() } }
            ]
        }).exec();

        // Filter by actual criteria matching
        return activeSubscriptions.filter(subscription =>
            this.matchesCriteria(subscription.criteria)
        );
    }

    /**
     * Checks if the resource matches a specific subscription criteria
     * @param criteria FHIR subscription criteria string (e.g., "Patient?status=active")
     * @returns True if resource matches the criteria
     */
    public matchesCriteria(criteria: string): boolean {

        const [resourceType, queryString] = criteria.split('?');
        
        if (resourceType !== this.resource.resourceType) {
            return false;
        }
        
        if (!queryString) {
            return true;
        }
        
        return this.evaluateQueryParameters(queryString);
    }
    
    /**
     * Evaluates all query parameters in the subscription criteria
     * @param queryString URL query parameters from subscription criteria
     * @returns True if all parameters match the resource
     */
    private evaluateQueryParameters(queryString: string): boolean {

        const params = new URLSearchParams(queryString);
        
        for (const [key, value] of params) {
            if (!this.matchParameter(key, value)) {
                return false;
            }
        }

        return true;
    }
    
    /**
     * Matches a single query parameter against the resource
     * @param param Parameter name (e.g., "status", "code", "subject")
     * @param value Expected parameter value
     * @returns True if parameter matches
     */
    private matchParameter(param: string, value: string): boolean {

        switch (param) {
            case '_profile':
                return this.matchProfile(value);
            case 'status':
                return this.resource.status === value;
            case 'code':
                return this.matchCode(value);
            case 'subject':
                return this.matchSubject(value);
            case 'active':
                return this.matchActive(value);
            default:
                return false;
        }
    }
    
    /**
     * Checks if resource conforms to specified FHIR profile
     * @param profileUrl Profile URL to match against
     * @returns True if resource has the profile in meta.profile
     */
    private matchProfile(profileUrl: string): boolean {

        const meta = this.resource.meta as any;

        return meta?.profile?.includes(profileUrl) || false;
    }

    /**
     * Matches code value against resource's coding array
     * @param codeValue Code to search for in resource.code.coding
     * @returns True if code is found in any coding entry
     */
    private matchCode(codeValue: string): boolean {

        const code = this.resource.code as any;

        if (!code) return false;
        
        // Check coding array for matching code
        if (code.coding && Array.isArray(code.coding)) {
            return code.coding.some((coding: any) => coding.code === codeValue);
        }
        
        return false;
    }

    /**
     * Matches subject reference with flexible matching
     * @param subjectReference Subject reference to match (supports partial matching)
     * @returns True if subject reference matches
     */
    private matchSubject(subjectReference: string): boolean {

        const subject = this.resource.subject as any;

        if (!subject?.reference) return false;
        
        return subject.reference === subjectReference ||
               subject.reference.endsWith(`/${subjectReference}`);
    }

    /**
     * Matches active status for Patient and other resources
     * @param activeValue Active value to match ("true" or "false")
     * @returns True if active status matches
     */
    private matchActive(activeValue: string): boolean {

        const active = this.resource.active as boolean;
        const expectedActive = activeValue === 'true';

        return active === expectedActive;
    }
}