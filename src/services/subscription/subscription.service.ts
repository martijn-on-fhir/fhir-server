import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { SubscriptionChannelType, SubscriptionDocument, SubscriptionSchema, SubscriptionStatus } from '../../schema/subscription-schema'
import { UpdateSubscriptionDto } from 'src/dto/update-subscription-dto'
import { Model, Types } from 'mongoose'
import { CreateSubscriptionDto } from 'src/dto/create-subscription-dto'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ResourceChangeEvent } from '../../interfaces/resource-change-event'
import axios from 'axios'

/**
 * Service for managing FHIR Subscriptions, handling creation, updates, and notifications
 * for different subscription types (REST Hook, WebSocket, Email).
 * Manages subscription lifecycle and handles resource change notifications.
 */
@Injectable()
export class SubscriptionService {
  
  /**
   * Creates an instance of SubscriptionService.
   * @param subscriptionModel - Mongoose model for Subscription documents
   * @param eventEmitter - Event emitter for handling resource change events
   */
  constructor(  @InjectModel(SubscriptionSchema.name) private subscriptionModel: Model<SubscriptionDocument>,
    private eventEmitter: EventEmitter2
  ) {
    // Listen for resource change events
    this.eventEmitter.on('resource.changed', this.handleResourceChange.bind(this))
  }
  
  /**
   * Creates a new subscription based on the provided DTO.
   * Validates criteria format and activates subscription if requested.
   * @param createDto - Data transfer object containing subscription details
   * @returns Created subscription document
   */
  async create(createDto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
   
    // Validate criteria format
    this.validateCriteria(createDto.criteria)
    
    const properties = {
      ...createDto,
      end: createDto.end ? new Date(createDto.end) : undefined,
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    }
    
    const subscription = new this.subscriptionModel(properties)
    const saved: SubscriptionDocument = await subscription.save()
    
    // Activate subscription if requested
    if (saved.status === SubscriptionStatus.REQUESTED) {
      await this.activateSubscription(saved?._id as string)
    }
    
    return saved
  }
  
  /**
   * Retrieves all subscriptions matching the provided filter.
   * @param filter - MongoDB filter criteria
   * @returns Array of subscription documents
   */
  async findAll(filter: any = {}): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find(filter).exec()
  }
  
  /**
   * Retrieves a single subscription by ID.
   * @param id - Subscription ID
   * @returns Subscription document
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if subscription not found
   */
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
  
  /**
   * Updates an existing subscription with new data.
   * @param id - Subscription ID
   * @param updateDto - Data transfer object containing update fields
   * @returns Updated subscription document
   */
  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionDocument> {
    
    const subscription = await this.findOne(id)
    
    Object.assign(subscription, updateDto)
    
    if (updateDto.end) {
      subscription.end = new Date(updateDto.end)
    }
    
    return subscription.save()
  }
  
  /**
   * Deletes a subscription by ID.
   * @param id - Subscription ID
   * @throws NotFoundException if subscription not found
   */
  async delete(id: string): Promise<void> {
    
    const result = await this.subscriptionModel.findByIdAndDelete(id).exec()
    
    if (!result) {
      throw new NotFoundException('Subscription not found')
    }
  }
  
  /**
   * Activates a subscription and tests the endpoint for REST hooks.
   * @param id - Subscription ID
   * @returns Updated subscription document
   */
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
  
  /**
   * Deactivates a subscription by setting its status to OFF.
   * @param id - Subscription ID
   * @returns Updated subscription document
   */
  async deactivateSubscription(id: string): Promise<SubscriptionDocument> {
    
    const subscription = await this.findOne(id)
    subscription.status = SubscriptionStatus.OFF
    
    return subscription.save()
  }
  
  // Find active subscriptions efficiently
  /**
   * Finds all active subscriptions for a specific resource type.
   * Filters out expired subscriptions based on end date.
   * @param resourceType - FHIR resource type
   * @returns Array of active subscription documents
   */
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
  
  /**
   * Handles resource change events by finding and notifying relevant active subscriptions.
   * @param event - The resource change event containing details about the changed resource
   */
  private async handleResourceChange(event: ResourceChangeEvent): Promise<void> {
    
    const activeSubscriptions = await this.findActiveSubscriptionsForResource(event.resourceType)
    
    const notificationPromises = activeSubscriptions
    .filter(subscription => this.matchesCriteria(event, subscription.criteria))
    .map(subscription => this.sendNotification(subscription, event))
    
    await Promise.allSettled(notificationPromises)
  }
  
  /**
   * Checks if a resource change event matches the subscription criteria.
   * @param event - The resource change event to evaluate
   * @param criteria - The subscription criteria to match against
   * @returns Boolean indicating if the event matches the criteria
   */
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
  
  /**
   * Sends a notification for a subscription based on its channel type.
   * Updates subscription metrics after successful notification.
   * @param subscription - The subscription document to send notification for
   * @param event - The resource change event that triggered the notification
   */
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
  
  /**
   * Sends a REST hook notification to the subscription endpoint.
   * Handles content type and custom headers configuration.
   * @param subscription - The subscription document containing endpoint details
   * @param event - The resource change event to send
   */
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
  
  /**
   * Emits a WebSocket notification event for the subscription.
   * @param subscription - The subscription document to send notification for
   * @param event - The resource change event to send
   */
  private async sendWebSocketNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    this.eventEmitter.emit('websocket.notification', {
      subscriptionId: subscription.id.toString(),
      notification: this.createNotificationBundle(subscription, event)
    })
  }
  
  /**
   * Sends an email notification for the subscription.
   * Currently logs the notification (implementation pending).
   * @param subscription - The subscription document to send notification for
   * @param event - The resource change event to send
   */
  private async sendEmailNotification(subscription: SubscriptionDocument, event: ResourceChangeEvent): Promise<void> {
    
    console.log(event)
    
    // Implement email notification logic
    console.log(`Email notification for subscription ${subscription._id}`)
  }
  
  /**
   * Creates a FHIR Bundle containing the notification details.
   * Includes SubscriptionStatus and the changed resource if available.
   * @param subscription - The subscription document to create notification for
   * @param event - The resource change event details
   * @returns FHIR Bundle containing notification details
   */
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
  
  /**
   * Tests the subscription endpoint by sending a test notification.
   * Used during subscription activation for REST hook subscriptions.
   * @param subscription - The subscription document containing endpoint details
   */
  private async testEndpoint(subscription: SubscriptionDocument): Promise<void> {
    
    const pPayload = {
      resourceType: 'Bundle',
      id: 'test-notification',
      type: 'history',
      timestamp: new Date().toISOString(),
      entry: []
    }
    
    const headers: Record<string, string> = {
      'Content-Type': subscription.channel.payload || 'application/fhir+json'
    }
    
    if (subscription.channel.header) {
      Object.entries(subscription.channel.header).forEach(([key, value]) => {
        headers[key] = value
      })
    }
    
    const config = {
      method: 'post',
      url: subscription.channel.endpoint,
      headers,
      data: pPayload
    }
    
    return await axios.request(config)
  }
  
  /**
   * Handles errors that occur during notification delivery.
   * Updates error metrics and deactivates subscription after too many errors.
   * @param subscription - The subscription document that encountered an error
   * @param error - The error that occurred
   */
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
  
  /**
   * Validates subscription criteria format and resource type.
   * Currently performs basic validation against supported resource types.
   * @param criteria - The subscription criteria to validate
   * @throws BadRequestException if criteria format or resource type is invalid
   */
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
