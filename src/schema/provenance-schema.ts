import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ProvenanceDocument = ProvenanceResource & Document

interface Period {
    start?: Date
    end?: Date
}

interface Coding {
    system?: string
    version?: string
    code?: string
    display?: string
    userSelected?: boolean
}

interface CodeableConcept {
    coding?: Coding[]
    text?: string
}

interface Reference {
    reference?: string
    type?: string
    identifier?: any
    display?: string
}

interface ProvenanceAgent {
    type?: CodeableConcept
    role?: CodeableConcept[]
    who: Reference
    onBehalfOf?: Reference
}

interface ProvenanceEntity {
    role: 'derivation' | 'revision' | 'quotation' | 'source' | 'removal'
    what: Reference
    agent?: ProvenanceAgent[]
}

interface Signature {
    type: Coding[]
    when: Date
    who: Reference
    onBehalfOf?: Reference
    targetFormat?: string
    sigFormat?: string
    data?: Buffer
}

@Schema({
    collection: 'provenance',
    timestamps: {createdAt: false, updatedAt: false},
    strict: false, // Toestaan van alle FHIR resource eigenschappen
    versionKey: false,
    // Discriminator op resourceType voor type-specifieke indexering
    discriminatorKey: 'resourceType'
})
export class ProvenanceResource {

    @Prop({
        required: true,
        index: true
    })
    id: string

    @Prop({required: true, index: true})
    resourceType: string = 'Provenance'

    @Prop({
        type: {
            versionId: String,
            lastUpdated: {type: Date, default: Date.now},
            profile: [String],
            security: [Object],
            tag: [Object],
            source: String
        }
    })
    meta?: {
        versionId?: string
        lastUpdated?: Date
        profile?: string[]
        security?: any[]
        tag?: any[]
        source?: string
    }

    // FHIR basis elementen (optioneel voor alle resources)
    @Prop()
    implicitRules?: string

    @Prop()
    language?: string

    @Prop({type: Object})
    text?: {
        status: 'generated' | 'extensions' | 'additional' | 'empty'
        div: string
    }

    @Prop([Object])
    contained?: any[]

    @Prop([Object])
    extension?: any[]

    @Prop([Object])
    modifierExtension?: any[]

    @Prop({type: [Object], required: true})
    target: Reference[]

    @Prop({type: Object})
    occurredPeriod?: Period

    @Prop({type: Date})
    occurredDateTime?: Date

    @Prop({type: Date, required: true})
    recorded: Date

    @Prop([String])
    policy?: string[]

    @Prop({type: Object})
    location?: Reference

    @Prop([Object])
    reason?: CodeableConcept[]

    @Prop({type: Object})
    activity?: CodeableConcept

    @Prop({type: [Object], required: true})
    agent: ProvenanceAgent[]

    @Prop([Object])
    entity?: ProvenanceEntity[]

    @Prop([Object])
    signature?: Signature[]
}

export const provenanceSchema = SchemaFactory.createForClass(ProvenanceResource)

provenanceSchema.index({'target.reference': 1})
provenanceSchema.index({recorded: -1})
provenanceSchema.index({'agent.who.reference': 1})
provenanceSchema.index({'activity.coding.code': 1})
provenanceSchema.index({'entity.what.reference': 1})

// Compound indexes for common queries
provenanceSchema.index({'target.reference': 1, recorded: -1})
provenanceSchema.index({'agent.who.reference': 1, recorded: -1})

// Virtual for easier querying
provenanceSchema.virtual('targetReferences').get(function () {
    return this.target?.map(t => t.reference).filter(Boolean) || []
})