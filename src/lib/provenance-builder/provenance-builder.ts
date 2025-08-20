import {Model} from "mongoose"
import {ProvenanceDocument} from "../../schema/provenance-schema"
import {v4 as uuidv4} from 'uuid'

export class ProvenanceBuilder {

    constructor(private readonly model: Model<ProvenanceDocument>) {
    }

    registerSearchOperation(payload: any): void {

        const resource = new this.model({
            id: uuidv4(),
            resourceType: 'Provenance',
            target: [
                {
                    reference: payload.resourceType + '/' + payload.id
                }
            ],
            recorded: new Date(),
            agent: [
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
            ],
            activity: {
                coding: [
                    {
                        system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                        code: "READ",
                        display: "read"
                    }
                ]
            },
        })

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
}