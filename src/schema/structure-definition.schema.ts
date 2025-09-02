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
  
  @Prop({ required: true, index: true, default: 'StructureDefinition' })
  resourceType: string;

  @Prop({ type: String })
  id?: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  @Prop({ type: String })
  implicitRules?: string;

  @Prop({ type: String })
  language?: string;

  @Prop({ type: Object })
  text?: Record<string, any>;

  @Prop({ type: [Object] })
  contained?: Record<string, any>[];

  @Prop({ type: [Object] })
  extension?: Record<string, any>[];

  @Prop({ type: [Object] })
  modifierExtension?: Record<string, any>[];
  
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  url: string;

  @Prop({ type: [Object] })
  identifier?: Record<string, any>[];

  @Prop({ type: String })
  version?: string;
  
  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  title?: string;
  
  @Prop({ required: true, enum: ['draft', 'active', 'retired', 'unknown'], index: true })
  status: string;

  @Prop({ type: Boolean })
  experimental?: boolean;

  @Prop({ type: Date })
  date?: Date;

  @Prop({ type: String })
  publisher?: string;

  @Prop({ type: [Object] })
  contact?: Record<string, any>[];

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [Object] })
  useContext?: Record<string, any>[];

  @Prop({ type: [Object] })
  jurisdiction?: Record<string, any>[];

  @Prop({ type: String })
  purpose?: string;

  @Prop({ type: String })
  copyright?: string;

  @Prop({ type: [Object] })
  keyword?: Record<string, any>[];

  @Prop({ type: String })
  fhirVersion?: string;

  @Prop({ type: [Object] })
  mapping?: Record<string, any>[];
  
  @Prop({ required: true, enum: ['primitive-type', 'complex-type', 'resource', 'logical'], index: true })
  kind: string;
  
  @Prop({ required: true, type: Boolean })
  abstract: boolean;

  @Prop({ type: [Object] })
  context?: Record<string, any>[];

  @Prop({ type: [String] })
  contextInvariant?: string[];
  
  @Prop({ required: true, index: true })
  type: string;

  @Prop({ type: String })
  baseDefinition?: string;

  @Prop({ type: String, enum: ['specialization', 'constraint'] })
  derivation?: string;

  @Prop({ type: Object })
  snapshot?: Record<string, any>;

  @Prop({ type: Object })
  differential?: Record<string, any>;

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
