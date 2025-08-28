import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type SubscriptionDocument = SubscriptionSchema & Document;

export enum SubscriptionStatus {
  REQUESTED = 'requested',
  ACTIVE = 'active',
  ERROR = 'error',
  OFF = 'off'
}

export enum SubscriptionChannelType {
  REST_HOOK = 'rest-hook',
  WEBSOCKET = 'websocket',
  EMAIL = 'email',
  SMS = 'sms',
  MESSAGE = 'message'
}

@Schema({ _id: false })
export class SubscriptionChannel {
 
  @Prop({ required: true, enum: SubscriptionChannelType })
  type: SubscriptionChannelType
  
  @Prop()
  endpoint?: string
  
  @Prop()
  payload?: string
  
  @Prop({ type: Map, of: String })
  header?: Map<string, string>
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const SubscriptionChannelSchema = SchemaFactory.createForClass(SubscriptionChannel)

@Schema({
  collection: 'subscriptions',
  timestamps: true,
  versionKey: false
})
export class SubscriptionSchema {
  
  @Prop({ default: 'Subscription' })
  resourceType: string
  
  @Prop({ required: true, enum: SubscriptionStatus, index: true })
  status: SubscriptionStatus
  
  @Prop({ required: true, index: true })
  criteria: string
  
  @Prop({ required: true, type: SubscriptionChannelSchema })
  channel: SubscriptionChannel
  
  @Prop()
  reason?: string
  
  @Prop()
  end?: Date
  
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
  }
  
  // FHIR base elements
  @Prop()
  implicitRules?: string
  
  @Prop()
  language?: string
  
  @Prop({type: Object})
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
  
  // Operational fields (not part of FHIR spec)
  @Prop({ default: 0 })
  errorCount: number
  
  @Prop()
  lastError?: string
  
  @Prop({ index: true })
  lastNotification?: Date
  
  @Prop()
  lastSuccessfulNotification?: Date
  
  // Automatic timestamps
  createdAt?: Date
  updatedAt?: Date
}

export const subscriptionSchema = SchemaFactory.createForClass(SubscriptionSchema)

// Indexes voor performance
subscriptionSchema.index({ resourceType: 1 })
subscriptionSchema.index({ criteria: 1 })
subscriptionSchema.index({ status: 1, criteria: 1 })
subscriptionSchema.index({ 'channel.type': 1 })
subscriptionSchema.index({ errorCount: 1 })

subscriptionSchema.pre('save', function(next) {
  
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
