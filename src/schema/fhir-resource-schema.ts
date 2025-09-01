import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import {v4 as uuidv4} from 'uuid'

export type FhirResourceDocument = FhirResource & Document;

/**
 * Mongoose schema for FHIR resources supporting all FHIR R4 resource types.
 * Uses a flexible schema design with discriminator patterns to handle various resource types
 * while maintaining consistent indexing and metadata handling.
 */
@Schema({
  collection: 'resources',
  timestamps: { createdAt: false, updatedAt: false },
  strict: false, // Toestaan van alle FHIR resource eigenschappen
  versionKey: false,
  // Discriminator op resourceType voor type-specifieke indexering
  discriminatorKey: 'resourceType'
})
export class FhirResource {
  // Core FHIR eigenschappen die altijd aanwezig zijn
  @Prop({
    required: true,
    index: true
  })
  id: string
  
  @Prop({ required: true, index: true })
  resourceType: string
  
  // FHIR Meta informatie
  @Prop({
    type: {
      versionId: String,
      lastUpdated: { type: Date, default: Date.now },
      profile: [String],
      security: [Object],
      tag: [Object],
      source: String
    }
  })
  meta?: {
    versionId?: string;
    lastUpdated?: Date;
    profile?: string[];
    security?: any[];
    tag?: any[];
    source?: string;
  }
  
  // FHIR basis elementen (optioneel voor alle resources)
  @Prop()
  implicitRules?: string
  
  @Prop()
  language?: string
  
  @Prop({ type: Object })
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  }
  
  @Prop([Object])
  contained?: any[]
  
  @Prop([Object])
  extension?: any[]
  
  @Prop([Object])
  modifierExtension?: any[]
  
  @Prop([Object])
  identifier?: any[]
  
  // Alle andere FHIR resource eigenschappen worden dynamisch toegevoegd
  // door strict: false
}

export const fhirResourceSchema = SchemaFactory.createForClass(FhirResource)

// Basis indexen voor alle resources
fhirResourceSchema.index({ resourceType: 1, id: 1 }, {
  unique: true,
  name: 'resourceId'
})

fhirResourceSchema.index({ resourceType: 1, 'meta.lastUpdated': 1 }, {
  name: 'lastUpdated'
})

fhirResourceSchema.index({ resourceType: 1, 'meta.security': 1 }, {
  name: 'security'
})

fhirResourceSchema.index({ 'meta.profile': 1 }, {
  name: 'profiles'
})

fhirResourceSchema.index({ 'identifier.system': 1, 'identifier.value': 1 }, {
  name: 'identifiers'
})

fhirResourceSchema.index({ 'meta.tag': 1 }, {
  name: 'tags'
})

fhirResourceSchema.index({'text.div': "text"}, {
  name: 'narrative'
})

// Resource-specifieke indexen
fhirResourceSchema.index({ resourceType: 1, status: 1 }, {
  name: 'status'
})

fhirResourceSchema.index({ resourceType: 1, 'subject.reference': 1 }) // Voor Observation.subject, etc.
fhirResourceSchema.index({ resourceType: 1, 'patient.reference': 1 }) // Voor Encounter.patient, etc.

// Pre-save hook voor meta.lastUpdated en meta.versionId
fhirResourceSchema.pre('save', function(next) {

  if (!this.id) {
    this.id = uuidv4()
  }

  this.meta = this.meta || {}
  this.meta.lastUpdated = new Date()
  
  if (!this.meta.versionId) {
    this.meta.versionId = '1'
  }
  
  if(this.meta.security && this.meta.security.length === 0) {
    
    this.meta.security.push({
      "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
      "code": "N",
      "display": "normal"
    })
  }
  
  next()
})