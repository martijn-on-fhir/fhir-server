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
  
  @Prop({
    required: true,
    index: true
  })
  url: string;
  
  @Prop({
    index: true,
    required: false
  })
  resourceType: string
  
  @Prop({
    required: true,
  })
  expansion: Record<string, any>[];
  
  @Prop({
    type: Object,
    required: true
  })
  value: Record<string, any>;
}

export const valueSetSchema = SchemaFactory.createForClass(ValueSetSchema);

// Indexes voor performance
valueSetSchema.index({ url: 1, resourceType: 1 });
