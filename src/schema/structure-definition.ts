import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StructureDefinitionDocument = StructureDefinition & Document;

@Schema({
  collection: 'structure-definitions',
  timestamps: { createdAt: true, updatedAt: false },
  strict: false,
  versionKey: false
})
export class StructureDefinition {
  
  @Prop({ required: true, index: true })
  resourceType: string;
  
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  url: string;

  @Prop({ type: Object })
  definition: Record<string, any>;
}

export const structureDefinitionSchema = SchemaFactory.createForClass(StructureDefinition);

// Indexes voor performance
structureDefinitionSchema.index({ resourceType: 1, url: 1 });
