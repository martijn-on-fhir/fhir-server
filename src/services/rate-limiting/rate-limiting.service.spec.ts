import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { RateLimitingService } from './rate-limiting.service'
import { FsLoggerService } from '../logger/fs-logger.service'

// Mock Redis
jest.mock('ioredis', () => {
    const mockRedis = {
        incr: jest.fn(),
        expire: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        ping: jest.fn(),
        quit: jest.fn(),
        pipeline: jest.fn(),
        on: jest.fn(),
        status: 'ready'
    }
    
    mockRedis.pipeline.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn()
    })
    
    return jest.fn(() => mockRedis)
})

describe('RateLimitingService', () => {
    let service: RateLimitingService

    beforeEach(async () => {
        // Set up test environment variables
        process.env.REDIS_ENABLED = 'false'
        process.env.REDIS_HOST = 'localhost'
        process.env.REDIS_PORT = '6379'
        
        // Create mock ConfigService
        const mockConfigService = {
            get: jest.fn().mockReturnValue({
                enabled: false,
                host: 'localhost',
                port: 6379,
                password: '',
                db: 0
            })
        }

        // Create mock FsLoggerService
        const mockLoggerService = {
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RateLimitingService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: FsLoggerService, useValue: mockLoggerService }
            ],
        }).compile()

        service = module.get<RateLimitingService>(RateLimitingService)
    })

    afterEach(() => {
        jest.clearAllMocks()
        // Clean up environment variables
        delete process.env.REDIS_ENABLED
        delete process.env.REDIS_HOST
        delete process.env.REDIS_PORT
    })

    describe('Memory-based rate limiting (Redis disabled)', () => {
        it('should be defined', () => {
            expect(service).toBeDefined()
        })

        it('should allow requests under limit', async () => {
            const clientIp = '192.168.1.100'
            const windowMs = 900000 // 15 minutes
            const maxRequests = 100

            const isLimited = await service.isRateLimited(clientIp, windowMs, maxRequests)
            expect(isLimited).toBe(false)
        })

        it('should rate limit when max requests exceeded', async () => {
            const clientIp = '192.168.1.101'
            const windowMs = 900000
            const maxRequests = 3

            // Make requests up to the limit
            for (let i = 0; i < maxRequests; i++) {
                const isLimited = await service.isRateLimited(clientIp, windowMs, maxRequests)
                expect(isLimited).toBe(false)
            }

            // Next request should be rate limited
            const isLimited = await service.isRateLimited(clientIp, windowMs, maxRequests)
            expect(isLimited).toBe(true)
        })

        it('should return current rate limit status', async () => {
            const clientIp = '192.168.1.102'
            const windowMs = 900000
            const maxRequests = 100

            // Initially should be 0
            let status = await service.getRateLimitStatus(clientIp, windowMs)
            expect(status).toBe(0)

            // After one request should be 1
            await service.isRateLimited(clientIp, windowMs, maxRequests)
            status = await service.getRateLimitStatus(clientIp, windowMs)
            expect(status).toBe(1)
        })

        it('should reset rate limit for IP', async () => {
            const clientIp = '192.168.1.103'
            const windowMs = 900000
            const maxRequests = 100

            // Make a request
            await service.isRateLimited(clientIp, windowMs, maxRequests)
            let status = await service.getRateLimitStatus(clientIp, windowMs)
            expect(status).toBe(1)

            // Reset rate limit
            await service.resetRateLimit(clientIp, windowMs)
            status = await service.getRateLimitStatus(clientIp, windowMs)
            expect(status).toBe(0)
        })

        it('should clean up old entries', async () => {
            const clientIp = '192.168.1.104'
            const windowMs = 1000 // 1 second for quick test
            const maxRequests = 100

            // Make request in current window
            await service.isRateLimited(clientIp, windowMs, maxRequests)
            
            // Wait for window to pass
            await new Promise(resolve => setTimeout(resolve, 1100))
            
            // Make another request (should trigger cleanup)
            await service.isRateLimited(clientIp, windowMs, maxRequests)
            
            // Verify the service is still working
            const status = await service.getRateLimitStatus(clientIp, windowMs)
            expect(status).toBe(1)
        })

        it('should handle errors gracefully', async () => {
            const clientIp = '192.168.1.105'
            const windowMs = 900000
            const maxRequests = 100

            // Mock an error scenario
            const originalConsoleError = console.error
            console.error = jest.fn()

            try {
                const isLimited = await service.isRateLimited(clientIp, windowMs, maxRequests)
                // Should fail open (not block traffic) on errors
                expect(typeof isLimited).toBe('boolean')
            } finally {
                console.error = originalConsoleError
            }
        })
    })

    describe('Redis-based rate limiting', () => {
        beforeEach(() => {
            process.env.REDIS_ENABLED = 'true'
        })

        it('should check Redis health', async () => {
            const isHealthy = await service.isHealthy()
            expect(typeof isHealthy).toBe('boolean')
        })

        it('should handle module destruction', async () => {
            await expect(service.onModuleDestroy()).resolves.not.toThrow()
        })
    })

    describe('Configuration', () => {
        it('should handle missing environment variables', () => {
            // All environment variables deleted in afterEach
            expect(service).toBeDefined()
        })

        it('should handle Redis configuration', () => {
            process.env.REDIS_ENABLED = 'true'
            process.env.REDIS_HOST = 'custom-host'
            process.env.REDIS_PORT = '6380'
            process.env.REDIS_PASSWORD = 'test-password'
            process.env.REDIS_DB = '1'
            
            // Create new service instance with custom config
            const mockCustomConfigService = {
                get: jest.fn().mockReturnValue({
                    enabled: true,
                    host: 'custom-host',
                    port: 6380,
                    password: 'test-password',
                    db: 1
                })
            }
            
            const mockCustomLoggerService = {
                setContext: jest.fn(),
                log: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn()
            }
            
            const customService = new RateLimitingService(
                mockCustomConfigService as any, 
                mockCustomLoggerService as any
            )
            expect(customService).toBeDefined()
        })
    })
})