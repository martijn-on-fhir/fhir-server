import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ValueSetDocument = ValueSetSchema & Document;

/**
 * Enumeration of possible ValueSet status values according to FHIR specification.
 */
export enum ValueSetStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RETIRED = 'retired',
  UNKNOWN = 'unknown'
}

/**
 * Schema for identifier elements in FHIR ValueSet resources.
 */
@Schema({ _id: false })
export class Identifier {
  @Prop({ type: String })
  use?: string;

  @Prop({ type: String })
  type?: string;

  @Prop({ type: String })
  system?: string;

  @Prop({ type: String })
  value?: string;
}

@Schema({ _id: false })
export class ContactDetail {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: [String] })
  telecom?: string[];
}

@Schema({ _id: false })
export class UsageContext {
  @Prop({ type: String })
  code?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  value?: any;
}

@Schema({ _id: false })
export class CodeableConcept {
  @Prop({ type: [Object] })
  coding?: any[];

  @Prop({ type: String })
  text?: string;
}

@Schema({ _id: false })
export class Coding {
  @Prop({ type: String })
  system?: string;

  @Prop({ type: String })
  version?: string;

  @Prop({ type: String })
  code?: string;

  @Prop({ type: String })
  display?: string;

  @Prop({ type: Boolean })
  userSelected?: boolean;
}

@Schema({ _id: false })
export class Designation {
  @Prop({ type: String })
  language?: string;

  @Prop({ type: Coding })
  use?: Coding;

  @Prop({ type: String, required: true })
  value: string;
}

@Schema({ _id: false })
export class ValueSetConcept {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String })
  display?: string;

  @Prop({ type: [Designation] })
  designation?: Designation[];
}

@Schema({ _id: false })
export class ValueSetFilter {
  @Prop({ type: String, required: true })
  property: string;

  @Prop({ type: String, required: true })
  op: string;

  @Prop({ type: String, required: true })
  value: string;
}

@Schema({ _id: false })
export class ValueSetInclude {
  @Prop({ type: String })
  system?: string;

  @Prop({ type: String })
  version?: string;

  @Prop({ type: [ValueSetConcept] })
  concept?: ValueSetConcept[];

  @Prop({ type: [ValueSetFilter] })
  filter?: ValueSetFilter[];

  @Prop({ type: [String] })
  valueSet?: string[];
}

/**
 * Schema for ValueSet compose element that defines the content logical definition.
 */
@Schema({ _id: false })
export class ValueSetCompose {
  @Prop({ type: Date })
  lockedDate?: Date;

  @Prop({ type: Boolean })
  inactive?: boolean;

  @Prop({ type: [ValueSetInclude], required: true })
  include: ValueSetInclude[];

  @Prop({ type: [ValueSetInclude] })
  exclude?: ValueSetInclude[];
}

@Schema({ _id: false })
export class ExpansionParameter {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  valueString?: string;

  @Prop({ type: Boolean })
  valueBoolean?: boolean;

  @Prop({ type: Number })
  valueInteger?: number;

  @Prop({ type: Number })
  valueDecimal?: number;

  @Prop({ type: String })
  valueUri?: string;

  @Prop({ type: String })
  valueCode?: string;

  @Prop({ type: Date })
  valueDateTime?: Date;
}

@Schema({ _id: false })
export class ExpansionContains {
  @Prop({ type: String })
  system?: string;

  @Prop({ type: Boolean })
  abstract?: boolean;

  @Prop({ type: Boolean })
  inactive?: boolean;

  @Prop({ type: String })
  version?: string;

  @Prop({ type: String })
  code?: string;

  @Prop({ type: String })
  display?: string;

  @Prop({ type: [Designation] })
  designation?: Designation[];

  @Prop({ type: MongooseSchema.Types.Array })
  contains?: ExpansionContains[];
}

/**
 * Schema for ValueSet expansion element containing the expanded codes.
 */
@Schema({ _id: false })
export class ValueSetExpansion {
  @Prop({ type: String })
  identifier?: string;

  @Prop({ type: Date, required: true })
  timestamp: Date;

  @Prop({ type: Number })
  total?: number;

  @Prop({ type: Number })
  offset?: number;

  @Prop({ type: [ExpansionParameter] })
  parameter?: ExpansionParameter[];

  @Prop({ type: [ExpansionContains] })
  contains?: ExpansionContains[];
}

@Schema({ _id: false })
export class Meta {
  @Prop({ type: String })
  versionId?: string;

  @Prop({ type: Date })
  lastUpdated?: Date;

  @Prop({ type: String })
  source?: string;

  @Prop({ type: [String] })
  profile?: string[];

  @Prop({ type: [String] })
  security?: string[];

  @Prop({ type: [String] })
  tag?: string[];
}

/**
 * Main Mongoose schema for FHIR ValueSet resources.
 * Supports complete FHIR ValueSet structure with compose, expansion, and metadata.
 */
@Schema({
  collection: 'values-sets',
  timestamps: { createdAt: true, updatedAt: true },
  strict: false,
  versionKey: false
})
export class ValueSetSchema {
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: Meta })
  meta?: Meta;

  @Prop({ type: String })
  implicitRules?: string;

  @Prop({ type: String })
  language?: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  url: string;

  @Prop({ type: [Identifier] })
  identifier?: Identifier[];

  @Prop({ type: String })
  version?: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String, enum: Object.values(ValueSetStatus), required: true })
  status: ValueSetStatus;

  @Prop({ type: Boolean })
  experimental?: boolean;

  @Prop({ type: Date })
  date?: Date;

  @Prop({ type: String })
  publisher?: string;

  @Prop({ type: [ContactDetail] })
  contact?: ContactDetail[];

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [UsageContext] })
  useContext?: UsageContext[];

  @Prop({ type: [CodeableConcept] })
  jurisdiction?: CodeableConcept[];

  @Prop({ type: Boolean })
  immutable?: boolean;

  @Prop({ type: String })
  purpose?: string;

  @Prop({ type: String })
  copyright?: string;

  @Prop({ type: ValueSetCompose })
  compose?: ValueSetCompose;

  @Prop({ type: ValueSetExpansion })
  expansion?: ValueSetExpansion;

  @Prop({ type: String, default: 'ValueSet' })
  resourceType: string;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const valueSetSchema = SchemaFactory.createForClass(ValueSetSchema);

// Indexes for performance
valueSetSchema.index({ status: 1 });
valueSetSchema.index({ name: 1 });
valueSetSchema.index({ 'compose.include.system': 1 });