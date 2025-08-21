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

        this.addAgent(resource)
        this.addTarget(resource)
        this.addActivity(resource, 'read')

        resource.save()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerCreateOperation(payload: any): void {

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerUpdateOperation(payload: any): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerDeleteOperation(payload: any): void {

    }

    private addAgent(model: Model<ProvenanceDocument>): void {

        model.agent =  [
            {
                type: {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
                            code: 'author'
                        }
                    ]
                }
            }
        ]
    }

    private addTarget(model: Model<ProvenanceDocument>): void {

        model.target = [{
            reference: payload.resourceType + '/' + payload.id
        }]
    }

    /**
     * Adds the specified activity to the provided model.
     *
     * @param {any} model - The model object to which the activity will be added.
     * @param {string} activity - The activity to be added to the model. Allowed values include 'read'.
     * @return {void} This method does not return any value.
     */
    private addActivity(model: Model<ProvenanceDocument>, activity: string): void {

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