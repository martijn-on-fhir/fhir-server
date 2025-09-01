import { Test, TestingModule } from '@nestjs/testing';
import { TerminologyService } from './terminology.service';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';

import axios from 'axios';
import {ValueSetSchema} from "../../schema/value-set.schema";

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TerminologyService', () => {
  let service: TerminologyService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockValueSetModel: any;

  beforeEach(async () => {
    const mockFindChain = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };

    mockValueSetModel = {
      findOne: jest.fn().mockReturnValue(mockFindChain),
      create: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'terminology.baseUrl':
            return 'https://test-server.com/';
          case 'terminology.enabled':
            return true;
          case 'terminology.tokenUrl':
            return 'https://test-server.com/auth/token';
          case 'terminology.username':
            return 'testuser';
          case 'terminology.password':
            return 'testpass';
          default:
            return undefined;
        }
      })
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminologyService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(ValueSetSchema.name),
          useValue: mockValueSetModel,
        },
      ],
    }).compile();

    service = module.get<TerminologyService>(TerminologyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(service.baseUrl).toBe('https://test-server.com/');
    expect(service.enabled).toBe(true);
    expect(mockConfigService.get).toHaveBeenCalledWith('terminology.baseUrl');
    expect(mockConfigService.get).toHaveBeenCalledWith('terminology.enabled');
  });

  describe('lookup', () => {
    it('should strip version from valueSet URL when pipe is present', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test|1.0.0';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);
      service.enabled = false;

      await service.lookup(valueSetUrl);

      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url: 'http://example.com/ValueSet/test' }, {_id: 0});
    });

    it('should return cached expansion when document exists', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      const mockDocument = {
        expansion: [{ code: 'cached-code', display: 'Cached Display' }]
      };
      mockValueSetModel.findOne().exec.mockResolvedValue(mockDocument);

      const result = await service.lookup(valueSetUrl);

      expect(result).toEqual([{ code: 'cached-code', display: 'Cached Display' }]);
      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url: valueSetUrl }, {_id: 0});
    });

    it('should return null when service is disabled and no cached document', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);
      service.enabled = false;

      const result = await service.lookup(valueSetUrl);

      expect(result).toBeUndefined();
    });

    it('should fetch from terminology server when enabled and not cached', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);
      
      const mockTokenResponse = {
        data: { access_token: 'test-token' }
      };
      
      const mockExpansionResponse = {
        data: {
          url: valueSetUrl,
          resourceType: 'ValueSet',
          expansion: {
            contains: [{ code: 'server-code', display: 'Server Display' }]
          }
        }
      };

      mockedAxios.request
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockExpansionResponse);

      const result = await service.lookup(valueSetUrl);

      expect(result).toEqual([{ code: 'server-code', display: 'Server Display' }]);
      expect(mockedAxios.request).toHaveBeenCalledTimes(2);
      expect(mockValueSetModel.create).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        url: valueSetUrl,
        resourceType: 'ValueSet',
        expansion: {
          contains: [{ code: 'server-code', display: 'Server Display' }]
        }
      }));
    });

    it('should reuse existing token for subsequent requests', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);
      service.token = 'existing-token';
      
      const mockExpansionResponse = {
        data: {
          url: valueSetUrl,
          resourceType: 'ValueSet',
          expansion: {
            contains: [{ code: 'server-code', display: 'Server Display' }]
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockExpansionResponse);

      await service.lookup(valueSetUrl);

      expect(mockedAxios.request).toHaveBeenCalledTimes(1);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        baseURL: 'https://test-server.com/',
        url: `fhir/ValueSet/$expand?url=${valueSetUrl}`,
        method: 'GET',
        headers: {
          authorization: 'Bearer existing-token',
        },
      });
    });

    it('should return null when expansion request fails', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);
      
      const mockTokenResponse = {
        data: { access_token: 'test-token' }
      };

      mockedAxios.request
        .mockResolvedValueOnce(mockTokenResponse)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.lookup(valueSetUrl);

      expect(result).toBeNull();
    });

    it('should not create document when cached document exists', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      const mockDocument = {
        expansion: []
      };
      mockValueSetModel.findOne().exec.mockResolvedValue(mockDocument);
      
      const result = await service.lookup(valueSetUrl);

      expect(result).toEqual([]);
      expect(mockValueSetModel.create).not.toHaveBeenCalled();
      expect(mockedAxios.request).not.toHaveBeenCalled();
    });
  });

  describe('_find', () => {
    it('should find document by URL', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/test';
      const mockDocument = { url: valueSetUrl };
      mockValueSetModel.findOne().exec.mockResolvedValue(mockDocument);

      const result = await (service as any)._find(valueSetUrl);

      expect(result).toBe(mockDocument);
      expect(mockValueSetModel.findOne).toHaveBeenCalledWith({ url: valueSetUrl }, {_id: 0});
    });

    it('should return null when document not found', async () => {
      const valueSetUrl = 'http://example.com/ValueSet/nonexistent';
      mockValueSetModel.findOne().exec.mockResolvedValue(null);

      const result = await (service as any)._find(valueSetUrl);

      expect(result).toBeNull();
    });
  });
});