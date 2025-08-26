import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from '../services/subscription/subscription.service';
import { SubscriptionStatus, SubscriptionChannelType } from '../schema/subscription-schema';
import { CreateSubscriptionDto } from '../dto/create-subscription-dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription-dto';

// Mock the AuthorizerGuard to avoid jose import issues
jest.mock('../guards/authorizer/authorizer.guard', () => ({
  AuthorizerGuard: jest.fn().mockImplementation(() => ({
    canActivate: (): boolean => true,
  })),
}));

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;

  const mockSubscription = {
    _id: '507f1f77bcf86cd799439011',
    resourceType: 'Subscription',
    status: SubscriptionStatus.ACTIVE,
    criteria: 'Patient?active=true',
    channel: {
      type: SubscriptionChannelType.REST_HOOK,
      endpoint: 'https://example.com/webhook',
      payload: 'application/fhir+json'
    },
    reason: 'Test subscription',
    meta: {
      versionId: '1',
      lastUpdated: new Date('2025-01-01T00:00:00Z')
    },
    errorCount: 0,
    lastError: undefined,
    lastNotification: undefined,
    lastSuccessfulNotification: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z')
  } as any;

  const mockCreateDto: CreateSubscriptionDto = {
    resourceType: 'Subscription',
    status: SubscriptionStatus.REQUESTED,
    criteria: 'Patient?active=true',
    channel: {
      type: SubscriptionChannelType.REST_HOOK,
      endpoint: 'https://example.com/webhook',
      payload: 'application/fhir+json'
    },
    reason: 'New test subscription'
  };

  const mockUpdateDto: UpdateSubscriptionDto = {
    status: SubscriptionStatus.ACTIVE,
    reason: 'Updated subscription'
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      activateSubscription: jest.fn(),
      deactivateSubscription: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockService
        }
      ]
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    mockSubscriptionService = module.get(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Dependencies', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(mockSubscriptionService).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new subscription successfully', async () => {
      mockSubscriptionService.create.mockResolvedValue(mockSubscription);

      const result = await controller.create(mockCreateDto);

      expect(mockSubscriptionService.create).toHaveBeenCalledWith(mockCreateDto);
      expect(mockSubscriptionService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSubscription);
    });

    it('should handle service errors during creation', async () => {
      const error = new Error('Database connection failed');
      mockSubscriptionService.create.mockRejectedValue(error);

      await expect(controller.create(mockCreateDto)).rejects.toThrow('Database connection failed');
      expect(mockSubscriptionService.create).toHaveBeenCalledWith(mockCreateDto);
    });

    it('should accept all valid subscription channel types', async () => {
      const testCases = [
        SubscriptionChannelType.REST_HOOK,
        SubscriptionChannelType.WEBSOCKET,
        SubscriptionChannelType.EMAIL,
        SubscriptionChannelType.SMS,
        SubscriptionChannelType.MESSAGE
      ];

      for (const channelType of testCases) {
        const dto = { ...mockCreateDto, channel: { ...mockCreateDto.channel, type: channelType } };
        const expectedResult = { ...mockSubscription, channel: { ...mockSubscription.channel, type: channelType } };
        
        mockSubscriptionService.create.mockResolvedValue(expectedResult);

        const result = await controller.create(dto);

        expect(result.channel.type).toBe(channelType);
      }
    });
  });

  describe('findAll', () => {
    const mockSubscriptions = [mockSubscription, { ...mockSubscription, _id: '507f1f77bcf86cd799439012' }];

    it('should return all subscriptions without filters', async () => {
      mockSubscriptionService.findAll.mockResolvedValue(mockSubscriptions);

      const result = await controller.findAll();

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSubscriptions);
    });

    it('should filter by valid subscription status', async () => {
      const filteredSubscriptions = [mockSubscription];
      mockSubscriptionService.findAll.mockResolvedValue(filteredSubscriptions);

      const result = await controller.findAll(SubscriptionStatus.ACTIVE);

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({
        status: SubscriptionStatus.ACTIVE
      });
      expect(result).toEqual(filteredSubscriptions);
    });

    it('should filter by both status and criteria', async () => {
      const filteredSubscriptions = [mockSubscription];
      mockSubscriptionService.findAll.mockResolvedValue(filteredSubscriptions);

      const result = await controller.findAll(SubscriptionStatus.ACTIVE, 'Patient');

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({
        status: SubscriptionStatus.ACTIVE,
        criteria: expect.any(RegExp)
      });
      expect(result).toEqual(filteredSubscriptions);
    });

    it('should ignore invalid subscription status', async () => {
      mockSubscriptionService.findAll.mockResolvedValue(mockSubscriptions);

      const result = await controller.findAll('invalid-status' as SubscriptionStatus);

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSubscriptions);
    });

    it('should handle empty criteria string', async () => {
      mockSubscriptionService.findAll.mockResolvedValue(mockSubscriptions);

      const result = await controller.findAll(undefined, '');

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSubscriptions);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database query failed');
      mockSubscriptionService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database query failed');
    });
  });

  describe('findOne', () => {
    it('should return a subscription by ID', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      mockSubscriptionService.findOne.mockResolvedValue(mockSubscription);

      const result = await controller.findOne(subscriptionId);

      expect(mockSubscriptionService.findOne).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual(mockSubscription);
    });

    it('should handle non-existent subscription ID', async () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      mockSubscriptionService.findOne.mockResolvedValue(null as any);

      const result = await controller.findOne(nonExistentId);

      expect(mockSubscriptionService.findOne).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBeNull();
    });

    it('should handle service errors during findOne', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const error = new Error('Subscription not found');
      mockSubscriptionService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(subscriptionId)).rejects.toThrow('Subscription not found');
    });
  });

  describe('update', () => {
    it('should update a subscription successfully', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const updatedSubscription = { ...mockSubscription, ...mockUpdateDto };
      mockSubscriptionService.update.mockResolvedValue(updatedSubscription);

      const result = await controller.update(subscriptionId, mockUpdateDto);

      expect(mockSubscriptionService.update).toHaveBeenCalledWith(subscriptionId, mockUpdateDto);
      expect(result).toEqual(updatedSubscription);
    });

    it('should handle partial updates', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const partialUpdateDto: UpdateSubscriptionDto = { status: SubscriptionStatus.ERROR };
      const updatedSubscription = { ...mockSubscription, status: SubscriptionStatus.ERROR };
      
      mockSubscriptionService.update.mockResolvedValue(updatedSubscription);

      const result = await controller.update(subscriptionId, partialUpdateDto);

      expect(mockSubscriptionService.update).toHaveBeenCalledWith(subscriptionId, partialUpdateDto);
      expect(result.status).toBe(SubscriptionStatus.ERROR);
    });

    it('should handle service errors during update', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const error = new Error('Update failed');
      mockSubscriptionService.update.mockRejectedValue(error);

      await expect(controller.update(subscriptionId, mockUpdateDto)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete a subscription successfully', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      mockSubscriptionService.delete.mockResolvedValue(undefined);

      const result = await controller.remove(subscriptionId);

      expect(mockSubscriptionService.delete).toHaveBeenCalledWith(subscriptionId);
      expect(result).toBeUndefined();
    });

    it('should handle service errors during deletion', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const error = new Error('Deletion failed');
      mockSubscriptionService.delete.mockRejectedValue(error);

      await expect(controller.remove(subscriptionId)).rejects.toThrow('Deletion failed');
    });
  });

  describe('activate', () => {
    it('should activate a subscription successfully', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const activatedSubscription = { ...mockSubscription, status: SubscriptionStatus.ACTIVE };
      mockSubscriptionService.activateSubscription.mockResolvedValue(activatedSubscription);

      const result = await controller.activate(subscriptionId);

      expect(mockSubscriptionService.activateSubscription).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual(activatedSubscription);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should handle service errors during activation', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const error = new Error('Activation failed');
      mockSubscriptionService.activateSubscription.mockRejectedValue(error);

      await expect(controller.activate(subscriptionId)).rejects.toThrow('Activation failed');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a subscription successfully', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const deactivatedSubscription = { ...mockSubscription, status: SubscriptionStatus.OFF };
      mockSubscriptionService.deactivateSubscription.mockResolvedValue(deactivatedSubscription);

      const result = await controller.deactivate(subscriptionId);

      expect(mockSubscriptionService.deactivateSubscription).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual(deactivatedSubscription);
      expect(result.status).toBe(SubscriptionStatus.OFF);
    });

    it('should handle service errors during deactivation', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      const error = new Error('Deactivation failed');
      mockSubscriptionService.deactivateSubscription.mockRejectedValue(error);

      await expect(controller.deactivate(subscriptionId)).rejects.toThrow('Deactivation failed');
    });
  });

  describe('Security and Input Validation', () => {
    describe('isValidSubscriptionStatus', () => {
      it('should validate correct subscription status values', () => {
        const validStatuses = [
          SubscriptionStatus.REQUESTED,
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.ERROR,
          SubscriptionStatus.OFF
        ];

        for (const status of validStatuses) {
          const isValid = (controller as any).isValidSubscriptionStatus(status);
          expect(isValid).toBe(true);
        }
      });

      it('should reject invalid subscription status values', () => {
        const invalidStatuses = ['invalid', 'PENDING', 'DISABLED', '', null, undefined];

        for (const status of invalidStatuses) {
          const isValid = (controller as any).isValidSubscriptionStatus(status);
          expect(isValid).toBe(false);
        }
      });
    });

    describe('escapeRegexCharacters', () => {
      it('should escape special regex characters', () => {
        const testCases = [
          { input: 'Patient?name=John', expected: 'Patient\\?name=John' },
          { input: 'test.*+?^${}()|[]\\', expected: 'test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\' },
          { input: 'normal-text_123', expected: 'normal-text_123' },
          { input: '', expected: '' },
          { input: 'test[a-z]+', expected: 'test\\[a-z\\]\\+' }
        ];

        for (const testCase of testCases) {
          const result = (controller as any).escapeRegexCharacters(testCase.input);
          expect(result).toBe(testCase.expected);
        }
      });

      it('should handle edge cases safely', () => {
        const edgeCases = [
          '\\\\\\\\', // Multiple backslashes
          '...***+++', // Multiple special chars
          '((()))', // Nested parentheses
          '[[[]]]' // Nested brackets
        ];

        for (const input of edgeCases) {
          const result = (controller as any).escapeRegexCharacters(input);
          expect(() => new RegExp(result)).not.toThrow();
        }
      });
    });

    describe('Combined filter scenarios', () => {
      it('should handle complex criteria with special characters and status filter', async () => {
        const complexCriteria = 'Patient?name=John.*(Smith)+&active=true';
        const filteredSubscriptions = [mockSubscription];
        mockSubscriptionService.findAll.mockResolvedValue(filteredSubscriptions);

        await controller.findAll(SubscriptionStatus.ACTIVE, complexCriteria);

        const call = mockSubscriptionService.findAll.mock.calls[0][0];
        expect(call.status).toBe(SubscriptionStatus.ACTIVE);
        expect(call.criteria).toBeInstanceOf(RegExp);
        expect(call.criteria.flags).toContain('i'); // Case insensitive
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined and null parameters gracefully', async () => {
      mockSubscriptionService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined, undefined);
      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({});

      await controller.findAll(null as any, null as any);
      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith({});
    });

    it('should handle empty string ID parameters', async () => {
      mockSubscriptionService.findOne.mockResolvedValue(null as any);

      const result = await controller.findOne('');
      expect(mockSubscriptionService.findOne).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should maintain service call integrity across operations', async () => {
      const subscriptionId = '507f1f77bcf86cd799439011';
      
      // Mock all service methods
      mockSubscriptionService.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionService.update.mockResolvedValue(mockSubscription);
      mockSubscriptionService.activateSubscription.mockResolvedValue(mockSubscription);
      mockSubscriptionService.deactivateSubscription.mockResolvedValue(mockSubscription);
      mockSubscriptionService.delete.mockResolvedValue(undefined);

      // Execute operations in sequence
      await controller.findOne(subscriptionId);
      await controller.update(subscriptionId, mockUpdateDto);
      await controller.activate(subscriptionId);
      await controller.deactivate(subscriptionId);
      await controller.remove(subscriptionId);

      // Verify each service method was called exactly once with correct parameters
      expect(mockSubscriptionService.findOne).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.update).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.activateSubscription).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.deactivateSubscription).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.delete).toHaveBeenCalledTimes(1);

      expect(mockSubscriptionService.findOne).toHaveBeenCalledWith(subscriptionId);
      expect(mockSubscriptionService.update).toHaveBeenCalledWith(subscriptionId, mockUpdateDto);
      expect(mockSubscriptionService.activateSubscription).toHaveBeenCalledWith(subscriptionId);
      expect(mockSubscriptionService.deactivateSubscription).toHaveBeenCalledWith(subscriptionId);
      expect(mockSubscriptionService.delete).toHaveBeenCalledWith(subscriptionId);
    });
  });
});