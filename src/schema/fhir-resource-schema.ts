import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FhirResourceDocument = FhirResource & Document;

@Schema({
  collection: 'resources',
  timestamps: { createdAt: true, updatedAt: false },
  strict: false, // Flexibiliteit voor verschillende FHIR resource types
  versionKey: false
})
export class FhirResource {
  
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  id: string;
  
  @Prop({ required: true, index: true })
  resourceType: string;
  
  @Prop({ type: Object }) // Flexibel voor alle FHIR data
  resource: Record<string, any>;
  
  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const fhirResourceSchema = SchemaFactory.createForClass(FhirResource);

// Indexes voor performance
fhirResourceSchema.index({ resourceType: 1, 'resource.id': 1, })
fhirResourceSchema.index({ 'resource.active': 1 })
fhirResourceSchema.index({ 'resource.meta.lastUpdated': 1 })
fhirResourceSchema.index({ 'resource.meta.profile': 1 })
fhirResourceSchema.index({ 'resource.identifier': 1 })
fhirResourceSchema.index({ 'tags': 1 })
