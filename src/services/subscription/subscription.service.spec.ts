import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { getModelToken } from '@nestjs/mongoose';
import { SubscriptionSchema, SubscriptionDocument, SubscriptionStatus, SubscriptionChannelType } from '../../schema/subscription-schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from '../../dto/create-subscription-dto';
import { UpdateSubscriptionDto } from '../../dto/update-subscription-dto';
import { ResourceChangeEvent } from '../../interfaces/resource-change-event';
import { Types } from 'mongoose';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockSubscriptionModel: any;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  const mockSubscriptionId = '507f1f77bcf86cd799439011';
  
  const mockSubscription = {
    _id: new Types.ObjectId(mockSubscriptionId),
    resourceType: 'Subscription',
    status: SubscriptionStatus.ACTIVE,
    criteria: 'Patient?active=true',
    channel: {
      type: SubscriptionChannelType.REST_HOOK,
      endpoint: 'https://example.com/webhook',
      payload: 'application/fhir+json'
    },
    reason: 'Test subscription',
    errorCount: 0,
    lastError: undefined,
    lastNotification: undefined,
    lastSuccessfulNotification: undefined,
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    },
    id: mockSubscriptionId,
    save: jest.fn()
  };

  const mockCreateDto: CreateSubscriptionDto = {
    resourceType: 'Subscription',
    status: SubscriptionStatus.REQUESTED,
    criteria: 'Patient?active=true',
    channel: {
      type: SubscriptionChannelType.REST_HOOK,
      endpoint: 'https://example.com/webhook',
      payload: 'application/fhir+json'
    },
    reason: 'Test subscription'
  };

  beforeEach(async () => {
    mockSubscriptionModel = jest.fn().mockImplementation((data) => ({
      ...mockSubscription,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockSubscription, ...data })
    }));
    
    mockSubscriptionModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockSubscription])
    });
    mockSubscriptionModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSubscription)
    });
    mockSubscriptionModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSubscription)
    });

    mockEventEmitter = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getModelToken(SubscriptionSchema.name),
          useValue: mockSubscriptionModel,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register event listener on instantiation', () => {
    expect(mockEventEmitter.on).toHaveBeenCalledWith('resource.changed', expect.any(Function));
  });

  describe('create', () => {
    it('should create a subscription successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(mockSubscriptionModel).toHaveBeenCalledWith({
        ...mockCreateDto,
        end: undefined,
        meta: {
          versionId: '1',
          lastUpdated: expect.any(Date)
        }
      });
      expect(result).toBeDefined();
    });

    it('should create subscription with end date', async () => {
      const dtoWithEndDate = { ...mockCreateDto, end: '2025-12-31T23:59:59Z' };

      await service.create(dtoWithEndDate);

      expect(mockSubscriptionModel).toHaveBeenCalledWith({
        ...dtoWithEndDate,
        end: new Date('2025-12-31T23:59:59Z'),
        meta: {
          versionId: '1',
          lastUpdated: expect.any(Date)
        }
      });
    });

    it('should activate subscription when status is REQUESTED', async () => {
      const requestedDto = { ...mockCreateDto, status: SubscriptionStatus.REQUESTED };
      const mockInstanceWithStatus = {
        ...mockSubscription,
        status: SubscriptionStatus.REQUESTED,
        _id: mockSubscriptionId,
        save: jest.fn().mockResolvedValue({ ...mockSubscription, status: SubscriptionStatus.REQUESTED })
      };
      
      mockSubscriptionModel.mockReturnValue(mockInstanceWithStatus);
      const activateSpy = jest.spyOn(service, 'activateSubscription').mockResolvedValue(mockSubscription as unknown as SubscriptionDocument);

      await service.create(requestedDto);

      expect(activateSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid criteria', async () => {
      const invalidDto = { ...mockCreateDto, criteria: '' };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unsupported resource type', async () => {
      const invalidDto = { ...mockCreateDto, criteria: 'UnsupportedResource?param=value' };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions with default filter', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockSubscription]);
      expect(mockSubscriptionModel.find).toHaveBeenCalledWith({});
    });

    it('should return filtered subscriptions', async () => {
      const filter = { status: SubscriptionStatus.ACTIVE };
      
      const result = await service.findAll(filter);

      expect(result).toEqual([mockSubscription]);
      expect(mockSubscriptionModel.find).toHaveBeenCalledWith(filter);
    });
  });

  describe('findOne', () => {
    it('should return subscription by valid ID', async () => {
      const result = await service.findOne(mockSubscriptionId);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionModel.findById).toHaveBeenCalledWith(mockSubscriptionId);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockSubscriptionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne(mockSubscriptionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update subscription successfully', async () => {
      const updateDto: UpdateSubscriptionDto = { status: SubscriptionStatus.OFF };
      const mockUpdatedSub = { ...mockSubscription, status: SubscriptionStatus.OFF, save: jest.fn().mockResolvedValue(mockSubscription) };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUpdatedSub as unknown as SubscriptionDocument);

      const result = await service.update(mockSubscriptionId, updateDto);

      expect(result).toBeDefined();
    });

    it('should update subscription with end date', async () => {
      const updateDto: UpdateSubscriptionDto = { end: '2025-12-31T23:59:59Z' };
      const mockSub = { ...mockSubscription, end: new Date(), save: jest.fn().mockResolvedValue(mockSubscription) };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSub as unknown as SubscriptionDocument);

      await service.update(mockSubscriptionId, updateDto);

      expect(mockSub.end).toEqual(new Date('2025-12-31T23:59:59Z'));
    });
  });

  describe('delete', () => {
    it('should delete subscription successfully', async () => {
      await service.delete(mockSubscriptionId);

      expect(mockSubscriptionModel.findByIdAndDelete).toHaveBeenCalledWith(mockSubscriptionId);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockSubscriptionModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.delete(mockSubscriptionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateSubscription', () => {
    it('should activate REST hook subscription successfully', async () => {
      const restHookSubscription = {
        ...mockSubscription,
        channel: { type: SubscriptionChannelType.REST_HOOK, endpoint: 'https://example.com/webhook' },
        save: jest.fn().mockResolvedValue(mockSubscription)
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(restHookSubscription as unknown as SubscriptionDocument);
      jest.spyOn(service as any, 'testEndpoint').mockResolvedValue(undefined);

      await service.activateSubscription(mockSubscriptionId);

      expect(restHookSubscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(restHookSubscription.errorCount).toBe(0);
      expect(restHookSubscription.lastError).toBeUndefined();
    });

    it('should activate non-REST hook subscription without testing endpoint', async () => {
      const websocketSubscription = {
        ...mockSubscription,
        channel: { type: SubscriptionChannelType.WEBSOCKET },
        save: jest.fn().mockResolvedValue(mockSubscription)
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(websocketSubscription as unknown as SubscriptionDocument);

      await service.activateSubscription(mockSubscriptionId);

      expect(websocketSubscription.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('deactivateSubscription', () => {
    it('should deactivate subscription successfully', async () => {
      const mockSub = { ...mockSubscription, save: jest.fn().mockResolvedValue(mockSubscription) };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSub as unknown as SubscriptionDocument);

      await service.deactivateSubscription(mockSubscriptionId);

      expect(mockSub.status).toBe(SubscriptionStatus.OFF);
    });
  });

  describe('findActiveSubscriptionsForResource', () => {
    it('should find active subscriptions for resource type', async () => {
      const result = await service.findActiveSubscriptionsForResource('Patient');

      expect(result).toEqual([mockSubscription]);
      expect(mockSubscriptionModel.find).toHaveBeenCalledWith({
        status: SubscriptionStatus.ACTIVE,
        criteria: new RegExp('^Patient', 'i'),
        $or: [
          { end: { $exists: false } },
          { end: { $gt: expect.any(Date) } }
        ]
      });
    });
  });

  describe('handleResourceChange', () => {
    it('should handle resource change event and send notifications', async () => {
      const event: ResourceChangeEvent = {
        eventType: 'create',
        resourceType: 'Patient',
        resourceId: '123',
        resource: { resourceType: 'Patient', id: '123' }
      };
      
      jest.spyOn(service, 'findActiveSubscriptionsForResource').mockResolvedValue([mockSubscription as unknown as SubscriptionDocument]);
      jest.spyOn(service as any, 'matchesCriteria').mockReturnValue(true);
      jest.spyOn(service as any, 'sendNotification').mockResolvedValue(undefined);

      await (service as any).handleResourceChange(event);

      expect(service.findActiveSubscriptionsForResource).toHaveBeenCalledWith('Patient');
      expect((service as any).sendNotification).toHaveBeenCalledWith(mockSubscription, event);
    });

    it('should filter out subscriptions that do not match criteria', async () => {
      const event: ResourceChangeEvent = {
        eventType: 'create',
        resourceType: 'Patient',
        resourceId: '123'
      };
      
      jest.spyOn(service, 'findActiveSubscriptionsForResource').mockResolvedValue([mockSubscription as unknown as SubscriptionDocument]);
      jest.spyOn(service as any, 'matchesCriteria').mockReturnValue(false);
      jest.spyOn(service as any, 'sendNotification').mockResolvedValue(undefined);

      await (service as any).handleResourceChange(event);

      expect((service as any).sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('matchesCriteria', () => {
    it('should return true for matching resource type', () => {
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Patient', resourceId: '123' };
      const criteria = 'Patient?active=true';

      const result = (service as any).matchesCriteria(event, criteria);

      expect(result).toBe(true);
    });

    it('should return false for non-matching resource type', () => {
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Observation', resourceId: '123' };
      const criteria = 'Patient?active=true';

      const result = (service as any).matchesCriteria(event, criteria);

      expect(result).toBe(false);
    });
  });

  describe('sendNotification', () => {
    it('should send REST hook notification successfully', async () => {
      const restHookSubscription = {
        ...mockSubscription,
        channel: { type: SubscriptionChannelType.REST_HOOK, endpoint: 'https://example.com/webhook' },
        save: jest.fn().mockResolvedValue(mockSubscription)
      };
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Patient', resourceId: '123' };
      
      jest.spyOn(service as any, 'sendRestHookNotification').mockResolvedValue(undefined);

      await (service as any).sendNotification(restHookSubscription, event);

      expect(restHookSubscription.lastNotification).toBeDefined();
      expect(restHookSubscription.lastSuccessfulNotification).toBeDefined();
      expect(restHookSubscription.errorCount).toBe(0);
    });

    it('should send WebSocket notification successfully', async () => {
      const websocketSubscription = {
        ...mockSubscription,
        channel: { type: SubscriptionChannelType.WEBSOCKET },
        save: jest.fn().mockResolvedValue(mockSubscription)
      };
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Patient', resourceId: '123' };

      await (service as any).sendNotification(websocketSubscription, event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('websocket.notification', expect.any(Object));
      expect(websocketSubscription.lastNotification).toBeDefined();
    });

    it('should send email notification successfully', async () => {
      const emailSubscription = {
        ...mockSubscription,
        channel: { type: SubscriptionChannelType.EMAIL, endpoint: 'test@example.com' },
        save: jest.fn().mockResolvedValue(mockSubscription)
      };
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Patient', resourceId: '123' };

      await (service as any).sendNotification(emailSubscription, event);

      expect(emailSubscription.lastNotification).toBeDefined();
    });

    it('should handle notification error', async () => {
      const subscription = { ...mockSubscription, save: jest.fn() };
      const event: ResourceChangeEvent = { eventType: 'create', resourceType: 'Patient', resourceId: '123' };
      const error = new Error('Network error');
      
      jest.spyOn(service as any, 'sendRestHookNotification').mockRejectedValue(error);
      jest.spyOn(service as any, 'handleNotificationError').mockResolvedValue(undefined);

      await (service as any).sendNotification(subscription, event);

      expect((service as any).handleNotificationError).toHaveBeenCalledWith(subscription, error);
    });
  });

  describe('createNotificationBundle', () => {
    it('should create notification bundle with resource', () => {
      const event: ResourceChangeEvent = {
        eventType: 'create',
        resourceType: 'Patient',
        resourceId: '123',
        resource: { resourceType: 'Patient', id: '123', name: [{ family: 'Doe' }] }
      };

      const bundle = (service as any).createNotificationBundle(mockSubscription, event);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('history');
      expect(bundle.entry).toHaveLength(2);
      expect(bundle.entry[0].resource.resourceType).toBe('SubscriptionStatus');
      expect(bundle.entry[1].resource).toEqual(event.resource);
    });

    it('should create notification bundle without resource', () => {
      const event: ResourceChangeEvent = {
        eventType: 'create',
        resourceType: 'Patient',
        resourceId: '123'
      };

      const bundle = (service as any).createNotificationBundle(mockSubscription, event);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.entry[0].resource.resourceType).toBe('SubscriptionStatus');
    });
  });

  describe('testEndpoint', () => {
    it('should test endpoint successfully', async () => {
      const subscription = {
        ...mockSubscription,
        channel: {
          type: SubscriptionChannelType.REST_HOOK,
          endpoint: 'https://example.com/webhook',
          payload: 'application/fhir+json',
          header: { 'Authorization': 'Bearer token' }
        }
      };

      mockedAxios.request.mockResolvedValue({ status: 200 });

      await (service as any).testEndpoint(subscription);

      expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'post',
        url: 'https://example.com/webhook',
        headers: expect.objectContaining({
          'Content-Type': 'application/fhir+json'
        }),
        data: expect.objectContaining({
          resourceType: 'Bundle',
          id: 'test-notification'
        })
      }));
    });
  });

  describe('handleNotificationError', () => {
    it('should increment error count and save error message', async () => {
      const subscription = { ...mockSubscription, errorCount: 0, save: jest.fn().mockResolvedValue(mockSubscription) };
      const error = new Error('Network timeout');

      await (service as any).handleNotificationError(subscription, error);

      expect(subscription.errorCount).toBe(1);
      expect(subscription.lastError).toBe('Network timeout');
      expect(subscription.save).toHaveBeenCalled();
    });

    it('should deactivate subscription after 5 errors', async () => {
      const subscription = { ...mockSubscription, errorCount: 4, save: jest.fn().mockResolvedValue(mockSubscription) };
      const error = new Error('Network timeout');

      await (service as any).handleNotificationError(subscription, error);

      expect(subscription.errorCount).toBe(5);
      expect(subscription.status).toBe(SubscriptionStatus.ERROR);
    });
  });

  describe('validateCriteria', () => {
    it('should validate correct criteria', () => {
      expect(() => (service as any).validateCriteria('Patient?active=true')).not.toThrow();
      expect(() => (service as any).validateCriteria('Observation?status=final')).not.toThrow();
    });

    it('should throw error for invalid criteria format', () => {
      expect(() => (service as any).validateCriteria('')).toThrow(BadRequestException);
      expect(() => (service as any).validateCriteria(null)).toThrow(BadRequestException);
      expect(() => (service as any).validateCriteria(123 as any)).toThrow(BadRequestException);
    });

    it('should throw error for unsupported resource type', () => {
      expect(() => (service as any).validateCriteria('UnsupportedResource?param=value')).toThrow(BadRequestException);
    });
  });
});