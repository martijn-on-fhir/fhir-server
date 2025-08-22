import {Model} from "mongoose"
import {ProvenanceDocument} from "../../schema/provenance-schema"
import {v4 as uuidv4} from 'uuid'
import {EventPayload} from "../../interfaces/event-payload";

/**
 * Builds and manages FHIR Provenance resources to track operations performed on FHIR resources.
 * Handles creation and storage of provenance records with standard coding systems for activities,
 * agents, and reasons.
 */
export class ProvenanceBuilder {

    /**
     * Creates a new ProvenanceBuilder instance.
     *
     * @param model - Mongoose model for persisting Provenance resources
     */
    constructor(private readonly model: Model<ProvenanceDocument>) {
    }

    /**
     * Creates and saves a new Provenance resource for a FHIR operation.
     *
     * @param payload - Event information containing resource details
     * @param activity - Type of activity performed (e.g., 'read', 'create', 'update', 'delete', 'search')
     */
    register(payload: EventPayload, activity: string): void {

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            recorded: new Date()
        })

        this.addReason(resource)
        this.addAgent(resource)
        this.addTarget(resource, payload)
        this.addActivity(resource, activity)

        resource.save()
    }

    /**
     * Adds standardized reason coding for patient administration to the Provenance resource.
     * Uses HL7 PurposeOfUse value set.
     *
     * @param model - The Provenance resource being built
     */
    private addReason(model: any): void {

        model.reason = [{
            system: "http://terminology.hl7.org/ValueSet/v3-PurposeOfUse",
            code: "PATADMIN",
            display: "Patient Administration"
        }]
    }

    /**
     * Adds agent information to the Provenance resource using IHE BALP UserAgentTypes.
     * Configures the agent as a UserOAuthAgent participant.
     *
     * @param model - The Provenance resource being built
     */
    private addAgent(model: any): void {

        model.agent = [{
            role: [
                {
                    coding: [
                        {
                            system: "https://profiles.ihe.net/ITI/BALP/CodeSystem/UserAgentTypes",
                            code: "UserOauthAgent",
                            display: "User OAuth Agent participant"
                        }
                    ]
                }
            ],
            whoReference: {
                display: "Unkown systen"
            }
        }]
    }

    /**
     * Adds target reference to the Provenance resource identifying the affected FHIR resource.
     *
     * @param model - The Provenance resource being built
     * @param payload - Event payload containing resource type and optional ID
     */
    private addTarget(model: any, payload: any): void {

        const id = payload.id as string

        model.target = [{
            reference: id ? payload.resourceType + '/' + payload.id : payload.resourceType
        }]
    }

    /**
     * Adds the specified activity to the provided model.
     *
     * @param {any} model - The model object to which the activity will be added.
     * @param {string} activity - The activity to be added to the model. Allowed values include 'read'.
     * @return {void} This method does not return any value.
     */
    private addActivity(model: any, activity: string): void {

        let entity: object | null = null

        switch (activity) {

            case 'read': {
                entity = {
                    system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                    code: "READ",
                    display: "read"
                }
                break
            }

            case 'execute': {
                entity = {
                    system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                    code: "EXECUTE",
                    display: "execute"
                }
                break
            }

            case 'create': {
                entity = {
                    system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                    code: "CREATE",
                    display: "create"
                }
                break
            }

            case 'update': {
                entity = {
                    system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                    code: "UPDATE",
                    display: "update"
                }
                break
            }

            case 'delete': {
                entity = {
                    system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                    code: "DELETE",
                    display: "delete"
                }
                break
            }

            default: {
                entity = null
            }
        }

        if (entity) {
            model.activity = {
                coding: [entity]
            }
        }
    }
}