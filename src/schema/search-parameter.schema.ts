import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SearchParameterDocument = SearchParameterSchema & Document;

export enum SearchParameterStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RETIRED = 'retired',
  UNKNOWN = 'unknown'
}

export enum SearchParameterType {
  NUMBER = 'number',
  DATE = 'date',
  STRING = 'string',
  TOKEN = 'token',
  REFERENCE = 'reference',
  COMPOSITE = 'composite',
  QUANTITY = 'quantity',
  URI = 'uri',
  SPECIAL = 'special'
}

export enum XPathUsage {
  NORMAL = 'normal',
  PHONETIC = 'phonetic',
  NEARBY = 'nearby',
  DISTANCE = 'distance',
  OTHER = 'other'
}

export enum SearchComparator {
  EQ = 'eq',
  NE = 'ne',
  GT = 'gt',
  LT = 'lt',
  GE = 'ge',
  LE = 'le',
  SA = 'sa',
  EB = 'eb',
  AP = 'ap'
}

export enum SearchModifier {
  MISSING = 'missing',
  EXACT = 'exact',
  CONTAINS = 'contains',
  NOT = 'not',
  TEXT = 'text',
  IN = 'in',
  NOT_IN = 'not-in',
  BELOW = 'below',
  ABOVE = 'above',
  TYPE = 'type',
  IDENTIFIER = 'identifier',
  OF_TYPE = 'ofType'
}

@Schema({ _id: false })
export class SearchParameterComponent {
  @Prop({ required: true })
  definition: string;

  @Prop({ required: true })
  expression: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const SearchParameterComponentSchema = SchemaFactory.createForClass(SearchParameterComponent);

@Schema({
  collection: 'search-parameters',
  timestamps: { createdAt: true, updatedAt: true },
  versionKey: false
})
export class SearchParameterSchema {
  
  @Prop({ default: 'SearchParameter' })
  resourceType: string;

  @Prop({ required: true, unique: true, index: true })
  url: string;

  @Prop()
  version?: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  derivedFrom?: string;

  @Prop({ required: true, enum: SearchParameterStatus, index: true })
  status: SearchParameterStatus;

  @Prop()
  experimental?: boolean;

  @Prop()
  date?: Date;

  @Prop()
  publisher?: string;

  @Prop([Object])
  contact?: any[];

  @Prop({ required: true })
  description: string;

  @Prop([Object])
  useContext?: any[];

  @Prop([Object])
  jurisdiction?: any[];

  @Prop()
  purpose?: string;

  @Prop({ required: true, index: true })
  code: string;

  @Prop({ required: true, type: [String], index: true })
  base: string[];

  @Prop({ required: true, enum: SearchParameterType, index: true })
  type: SearchParameterType;

  @Prop()
  expression?: string;

  @Prop()
  xpath?: string;

  @Prop({ enum: XPathUsage })
  xpathUsage?: XPathUsage;

  @Prop([String])
  target?: string[];

  @Prop()
  multipleOr?: boolean;

  @Prop()
  multipleAnd?: boolean;

  @Prop({ type: [String], enum: SearchComparator })
  comparator?: SearchComparator[];

  @Prop({ type: [String], enum: SearchModifier })
  modifier?: SearchModifier[];

  @Prop([String])
  chain?: string[];

  @Prop({ type: [SearchParameterComponentSchema] })
  component?: SearchParameterComponent[];

  // FHIR Meta information
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
  };

  // FHIR base elements
  @Prop()
  implicitRules?: string;

  @Prop()
  language?: string;

  @Prop({ type: Object })
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  };

  @Prop([Object])
  contained?: any[];

  @Prop([Object])
  extension?: any[];

  @Prop([Object])
  modifierExtension?: any[];

  // Automatic timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const searchParameterSchema = SchemaFactory.createForClass(SearchParameterSchema);

// Indexes for performance
searchParameterSchema.index({ resourceType: 1 });
searchParameterSchema.index({ url: 1, version: 1 });
searchParameterSchema.index({ base: 1, code: 1 });
searchParameterSchema.index({ status: 1, type: 1 });

searchParameterSchema.pre('save', function(next) {
  if (!this.meta) {
    this.meta = {};
  }
  
  this.meta.lastUpdated = new Date();
  
  // Generate versionId if not exists
  if (!this.meta.versionId) {
    this.meta.versionId = '1';
  } else if (this.isModified() && !this.isNew) {
    this.meta.versionId = String(Number(this.meta.versionId) + 1);
  }
  
  next();
});