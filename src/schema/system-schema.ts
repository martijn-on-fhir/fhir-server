import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type SystemDocument = SystemSchema & Document;

@Schema({
    collection: 'system',
    timestamps: { createdAt: false},
    strict: false, // Toestaan van alle FHIR resource eigenschappen
    versionKey: false,
})
export class SystemSchema {

    @Prop({type: Object})
    memory: {
        heap: number
        rss: number
        external: number
        total: number
    }

    @Prop({type: Object})
    cpu: {
        system: number
        user: number
    }
}

export const systemSchema = SchemaFactory.createForClass(SystemSchema)