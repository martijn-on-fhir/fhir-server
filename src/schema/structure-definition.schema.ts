import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StructureDefinitionDocument = StructureDefinitionSchema & Document;

@Schema({
  collection: 'structure-definitions',
  timestamps: { createdAt: true, updatedAt: false },
  strict: false,
  versionKey: false
})
export class StructureDefinitionSchema {
  
  @Prop({ required: true, index: true })
  resourceType: string;
  
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  url: string;
  
  @Prop({
    required: true,
    default: '4',
    index: true
  })
  release: number;

  @Prop({ type: Object })
  definition: Record<string, any>;
}

export const structureDefinitionSchema = SchemaFactory.createForClass(StructureDefinitionSchema);

// Indexes voor performance
structureDefinitionSchema.index({ resourceType: 1, url: 1, release: 1 });
