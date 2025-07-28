import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ValueSetDocument = ValueSetSchema & Document;

@Schema({
  collection: 'values-sets',
  timestamps: { createdAt: true, updatedAt: false },
  strict: false,
  versionKey: false
})
export class ValueSetSchema {
  
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
    index: true
  })
  release: number;
  
  @Prop({
    required: true,
  })
  concept: Record<string, any>[];
  
  @Prop({ type: Object })
  definition: Record<string, any>;
}

export const valueSetSchema = SchemaFactory.createForClass(ValueSetSchema);

// Indexes voor performance
valueSetSchema.index({ resourceType: 1, url: 1, release: 1 });
