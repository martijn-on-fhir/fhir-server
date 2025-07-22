import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FhirResourceDocument = FhirResource & Document;

@Schema({
  collection: 'resources',
  timestamps: { createdAt: 'meta.lastUpdated', updatedAt: false },
  strict: false, // Flexibiliteit voor verschillende FHIR resource types
  versionKey: false
})
export class FhirResource {
  @Prop({ required: true, index: true })
  resourceType: string;
  
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  id: string;
  
  @Prop({
    type: Object,
    default: () => ({
      versionId: '1',
      lastUpdated: new Date(),
      profile: []
    })
  })
  meta: {
    versionId: string;
    lastUpdated: Date;
    profile?: string[];
    security?: any[];
    tag?: any[];
  };
  
  @Prop({ type: Object }) // Flexibel voor alle FHIR data
  resource: Record<string, any>;
  
  @Prop({ default: 'active', index: true })
  status: string;
  
  @Prop({ type: [String], default: [] })
  tags: string[];
  
  // Index voor zoeken
  @Prop({ type: Object, default: {} })
  searchParams: Record<string, any>;
}

export const fhirResourceSchema = SchemaFactory.createForClass(FhirResource);

// Indexes voor performance
fhirResourceSchema.index({ resourceType: 1, id: 1 });
fhirResourceSchema.index({ resourceType: 1, status: 1 });
fhirResourceSchema.index({ 'meta.lastUpdated': -1 });
