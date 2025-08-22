import {Model} from "mongoose"
import {ProvenanceDocument} from "../../schema/provenance-schema"
import {v4 as uuidv4} from 'uuid'

export class ProvenanceBuilder {

    constructor(private readonly model: Model<ProvenanceDocument>) {
    }

    registerSearchOperation(payload: any): void {

        console.log(payload)

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            recorded: new Date()
        })

        this.addReason(resource)
        this.addAgent(resource)
        this.addTarget(resource)
        this.addActivity(resource, 'read')

        resource.save()
    }
     
    registerCreateOperation(payload: any): void {

        console.log(payload)

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            recorded: new Date()
        })

        this.addReason(resource)
        this.addAgent(resource)
        this.addTarget(resource)
        this.addActivity(resource, 'create')

        resource.save()
    }
     
    registerUpdateOperation(payload: any): void {

        console.log(payload)

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            recorded: new Date()
        })

        this.addReason(resource)
        this.addAgent(resource)
        this.addTarget(resource)
        this.addActivity(resource, 'update')

        resource.save()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerDeleteOperation(payload: any): void {

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            recorded: new Date()
        })

        this.addReason(resource)
        this.addAgent(resource)
        this.addTarget(resource)
        this.addActivity(resource, 'delete')

        resource.save()
    }

    private addReason(model: any): void {

        model.reason = [{
            system: "http://terminology.hl7.org/ValueSet/v3-PurposeOfUse",
            code: "PATADMIN",
            display: "Patient Administration"
        }]
    }

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

    private addTarget(model: any): void {

        model.target = [{
            reference: 'payload.resourceType' + '/' + ' payload.id'
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

        switch (activity) {

            case 'read': {
                model.activity = {
                    coding: [
                        {
                            system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                            code: "READ",
                            display: "read"
                        }
                    ]
                }
                break
            }
        }
    }
}