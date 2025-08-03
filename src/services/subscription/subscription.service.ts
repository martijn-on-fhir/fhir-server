import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { SubscriptionChannelType, SubscriptionDocument, SubscriptionSchema, SubscriptionStatus } from '../../schema/subscription-schema'
import { UpdateSubscriptionDto } from 'src/dto/update-subscription-dto'
import { Model, Types } from 'mongoose'
import { CreateSubscriptionDto } from 'src/dto/create-subscription-dto'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ResourceChangeEvent } from '../../interfaces/resource-change-event'

@Injectable()
export class SubscriptionService {
  
  constructor(  @InjectModel(SubscriptionSchema.name) private subscriptionModel: Model<SubscriptionDocument>,
    private eventEmitter: EventEmitter2
  ) {
    // Listen for resource change events
    this.eventEmitter.on('resource.changed', this.handleResourceChange.bind(this))
  }
  
  async create(createDto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
   
    // Validate criteria format
    this.validateCriteria(createDto.criteria)
    
    const subscription = new this.subscriptionModel({
      ...createDto,
      end: createDto.end ? new Date(createDto.end) : undefined,
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    })
    
    const saved: SubscriptionDocument = await subscription.save()
    
    // Activate subscription if requested
    if (saved.status === SubscriptionStatus.REQUESTED) {
      await this.activateSubscription(saved.id.toString())
    }
    
    return saved
  }
  
  async findAll(filter: any = {}): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find(filter).exec()
  }
  
  async findOne(id: string): Promise<SubscriptionDocument> {
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subscription ID')
    }
    
    const subscription = await this.subscriptionModel.findById(id).exec()
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found')
    }
    
    return subscription
  }
  
  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionDocument> {
    
    const subscription = await this.findOne(id)
    
    Object.assign(subscription, updateDto)
    
    if (updateDto.end) {
      subscription.end = new Date(updateDto.end)
    }
    
    return subscription.save()
  }
  
  async delete(id: string): Promise<void> {
    
    const result = await this.subscriptionModel.findByIdAndDelete(id).exec()
    
    if (!result) {
      throw new NotFoundException('Subscription not found')
    }
  }
  
  async activateSubscription(id: string): Promise<SubscriptionDocument> {
    
    const subscription = await this.findOne(id)
    
    // Test the endpoint for rest-hook subscriptions
    if (subscription.channel.type === SubscriptionChannelType.REST_HOOK) {
      await this.testEndpoint(subscription)
    }
    
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.errorCount = 0
    subscription.lastError = undefined
    
    return subscription.save()
  }
  
  async deactivateSubscription(id: string): Promise<SubscriptionDocument> {
    
    const subscription = await this.findOne(id)
    subscription.status = SubscriptionStatus.OFF
    
    return subscription.save()
  }
  
  // Find active subscriptions efficiently
  async findActiveSubscriptionsForResource(resourceType: string): Promise<SubscriptionDocument[]> {
    
    return this.subscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
      criteria: new RegExp(`^${resourceType}`, 'i'), // Case-insensitive starts with
      $or: [
        { end: { $exists: false } },
        { end: { $gt: new Date() } }
      ]
    }).exec()
  }
  
  private async handleResourceChange(event: ResourceChangeEvent): Promise<void> {
    
    const activeSubscriptions = await this.findActiveSubscriptionsForResource(event.resourceType)
    
    const notificationPromises = activeSubscriptions
    .filter(subscription => this.matchesCriteria(event, subscription.criteria))
    .map(subscription => this.sendNotification(subscription, event))
    
    await Promise.allSettled(notificationPromises)
  }
  
  private matchesCriteria(event: ResourceChangeEvent, criteria: string): boolean {
    
    // Parse criteria (simplified - in production use a proper FHIRPath evaluator)
    const [resourceType, queryParams] = criteria.split('?')
    
    console.log(queryParams)
    
    // Check if resource type matches
    if (resourceType !== event.resourceType) {
      return false
    }
    
    // TODO: Implement full FHIRPath evaluation for query parameters
    // For now, return true if resource type matches
    return true
  }
  
  private async sendNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    try {
      switch (subscription.channel.type) {
        case SubscriptionChannelType.REST_HOOK:
          await this.sendRestHookNotification(subscription, event)
          break
        case SubscriptionChannelType.WEBSOCKET:
          await this.sendWebSocketNotification(subscription, event)
          break
        case SubscriptionChannelType.EMAIL:
          await this.sendEmailNotification(subscription, event)
          break
        default:
          console.warn(`Unsupported channel type: ${subscription.channel.type}`)
      }
      
      // Update success metrics
      subscription.lastNotification = new Date()
      subscription.lastSuccessfulNotification = new Date()
      subscription.errorCount = 0
      subscription.lastError = undefined
      await subscription.save()
      
    } catch (error) {
      await this.handleNotificationError(subscription, error)
    }
  }
  
  private async sendRestHookNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    const notification = this.createNotificationBundle(subscription, event)
    
    console.log(notification)
    
    const headers: Record<string, string> = {
      'Content-Type': subscription.channel.payload || 'application/fhir+json'
    }
    
    // Add custom headers
    if (subscription.channel.header) {
      
      Object.entries(subscription.channel.header).forEach(([key, value]) => {
        headers[key] = value
      })
    }
    
    /**
     * @todo send request with axios
     */
    
    console.log(`Sent REST hook notification to ${subscription.channel.endpoint}`)
  }
  
  private async sendWebSocketNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    this.eventEmitter.emit('websocket.notification', {
      subscriptionId: subscription.id.toString(),
      notification: this.createNotificationBundle(subscription, event)
    })
  }
  
  private async sendEmailNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    console.log(event)
    
    // Implement email notification logic
    console.log(`Email notification for subscription ${subscription._id}`)
  }
  
  private createNotificationBundle(subscription: SubscriptionDocument, event: ResourceChangeEvent): any {
   
    return {
      resourceType: 'Bundle',
      id: `notification-${Date.now()}`,
      type: 'history',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'SubscriptionStatus',
            id: `status-${subscription._id}`,
            status: 'active',
            type: 'event-notification',
            subscription: {
              reference: `Subscription/${subscription._id}`
            },
            topic: subscription.criteria,
            notificationEvent: [
              {
                eventNumber: Date.now(),
                timestamp: new Date().toISOString(),
                focus: {
                  reference: `${event.resourceType}/${event.resourceId}`
                }
              }
            ]
          }
        },
        ...(event.resource ? [{
          fullUrl: `${event.resourceType}/${event.resourceId}`,
          resource: event.resource
        }] : [])
      ]
    }
  }
  
  private async testEndpoint(subscription: SubscriptionDocument): Promise<void> {
    
    const testPayload = {
      resourceType: 'Bundle',
      id: 'test-notification',
      type: 'history',
      timestamp: new Date().toISOString(),
      entry: []
    }
    
    console.log(testPayload)
    
    const headers: Record<string, string> = {
      'Content-Type': subscription.channel.payload || 'application/fhir+json'
    }
    
    if (subscription.channel.header) {
      Object.entries(subscription.channel.header).forEach(([key, value]) => {
        headers[key] = value
      })
    }
    
    /**
     * @todo send with axios
     */
  }
  
  private async handleNotificationError(subscription: SubscriptionDocument, error: any): Promise<void> {
    subscription.errorCount++
    subscription.lastError = error.message
    
    // Deactivate subscription after too many errors
    if (subscription.errorCount >= 5) {
      subscription.status = SubscriptionStatus.ERROR
      console.error(`Subscription ${subscription._id} deactivated due to repeated errors`)
    }
    
    await subscription.save()
  }
  
  private validateCriteria(criteria: string): void {
    // Basic validation - in production, use proper FHIRPath validation
    if (!criteria || typeof criteria !== 'string') {
      throw new BadRequestException('Invalid subscription criteria format')
    }
    
    // Should contain resource type
    const validResourceTypes = ['Patient', 'Observation', 'Practitioner', 'Organization', 'Encounter']
    const resourceType = criteria.split('?')[0]
    
    if (!validResourceTypes.includes(resourceType)) {
      throw new BadRequestException(`Unsupported resource type in criteria: ${resourceType}`)
    }
  }
}
