import {Injectable} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import Redis from 'ioredis'
import {FsLoggerService} from '../logger/fs-logger.service'

/**
 * Redis-based rate limiting service for production scalability.
 * Provides distributed rate limiting across multiple server instances.
 * Features:
 * - Redis-based distributed rate limiting
 * - In-memory fallback when Redis is unavailable
 * - Configurable time windows and request limits
 * - Automatic cleanup of expired entries
 * - Health monitoring and graceful shutdown
 */
@Injectable()
export class RateLimitingService {

    /**
     * An instance of a Redis connection or null.
     * This variable holds the Redis connection to interact with the Redis server.
     * If no connection is established, the value will be null.
     *
     * Type: Redis | null
     */
    private redis: Redis | null = null

    /**
     * A Map object that serves as a fallback storage mechanism where keys are strings
     * and values are numbers. It is typically used to handle default or backup data
     * when the primary storage is unavailable or insufficient.
     */
    private readonly fallbackStore = new Map<string, number>()

    /**
     * Creates a new instance of RateLimitingService
     * @param configService - NestJS ConfigService for accessing configuration
     * @param logger - Logger service for operational logging
     */
    constructor(private readonly configService: ConfigService, private readonly logger: FsLoggerService) {

        this.logger.setContext(Object.getPrototypeOf(this).constructor.name)
        this.initializeRedis()
    }

    /**
     * Initialize Redis connection with fallback to in-memory storage
     */
    private initializeRedis(): void {
        try {
            const redisConfig = this.getRedisConfig()

            if (redisConfig.enabled) {

                this.redis = new Redis({
                    host: redisConfig.host,
                    port: redisConfig.port,
                    password: redisConfig.password || undefined,
                    db: redisConfig.db,
                    maxRetriesPerRequest: 3,
                    connectTimeout: 5000,
                    lazyConnect: false, // Connect immediately
                    enableOfflineQueue: false, // Don't queue commands when disconnected
                })

                this.redis.on('error', (error) => {
                    this.logger.error('Redis connection error:', error.message)
                    this.logger.warn('Falling back to in-memory rate limiting')
                })

                this.redis.on('connect', () => {
                    this.logger.log('Redis connected for rate limiting')
                })

                this.redis.on('ready', () => {
                    this.logger.log('Redis ready for rate limiting operations')
                })

                this.redis.on('close', () => {
                    this.logger.warn('Redis connection closed, using in-memory fallback')
                })

                setTimeout(() => {
                    this.logger.log(`Redis initial status: ${this.redis?.status}`)
                }, 1000)

            } else {
                this.logger.warn('Redis disabled, using in-memory rate limiting')
            }
        } catch (error) {
            this.logger.error('Failed to initialize Redis:', error.message)
            this.logger.warn('Using in-memory rate limiting as fallback')
        }
    }

    /**
     * Get Redis configuration from application config
     */
    private getRedisConfig(): {
        enabled: boolean, host: string,
        port: number, password?: string, db: number
    } {
        const config = this.configService.get('redis', {
            enabled: false,
            host: 'localhost',
            port: 6379,
            password: '',
            db: 0
        })

        // Also check environment variables as fallback
        return {
            enabled: config.enabled || process.env.REDIS_ENABLED === 'true',
            host: config.host || process.env.REDIS_HOST || 'localhost',
            port: config.port || parseInt(process.env.REDIS_PORT || '6379', 10),
            password: config.password || process.env.REDIS_PASSWORD || undefined,
            db: config.db || parseInt(process.env.REDIS_DB || '0', 10)
        }
    }

    /**
     * Check if a client IP has exceeded the rate limit
     * @param clientIp - Client IP address to check
     * @param windowMs - Time window in milliseconds for rate limiting
     * @param maxRequests - Maximum number of requests allowed within the window
     * @returns Promise resolving to true if rate limit is exceeded, false otherwise
     * @throws Will not throw, returns false on errors to fail open
     */
    async isRateLimited(clientIp: string, windowMs: number, maxRequests: number): Promise<boolean> {

        const now = Date.now()
        const windowKey = Math.floor(now / windowMs)
        const key = `rate_limit:${clientIp}:${windowKey}`

        try {
            if (this.redis && this.redis.status === 'ready') {
                return await this.checkRedisRateLimit(key, windowMs, maxRequests)
            } else {
                return this.checkMemoryRateLimit(key, windowMs, maxRequests, now)
            }
        } catch (error) {
            this.logger.error('Rate limiting check failed:', error.message)
            // Fail open to avoid blocking legitimate traffic
            return false
        }
    }

    /**
     * Redis-based rate limiting check with atomic operations
     */
    private async checkRedisRateLimit(key: string, windowMs: number, maxRequests: number): Promise<boolean> {

        if (!this.redis) {
            return false
        }

        const pipeline = this.redis.pipeline()

        // Increment counter atomically
        pipeline.incr(key)
        pipeline.expire(key, Math.ceil(windowMs / 1000))

        const results = await pipeline.exec()

        if (results && results[0] && results[0][1]) {
            const currentCount = results[0][1] as number
            return currentCount > maxRequests
        }

        return false
    }

    /**
     * In-memory fallback rate limiting with cleanup
     */
    private checkMemoryRateLimit(key: string, windowMs: number, maxRequests: number, now: number): boolean {

        const current = this.fallbackStore.get(key) || 0

        if (current >= maxRequests) {
            return true
        }

        this.fallbackStore.set(key, current + 1)

        // Cleanup old entries
        this.cleanupMemoryStore(windowMs, now)

        return false
    }

    /**
     * Clean up expired entries from memory store
     */
    private cleanupMemoryStore(windowMs: number, now: number): void {

        const currentWindow = Math.floor(now / windowMs)

        for (const [storeKey] of this.fallbackStore) {
            if (storeKey.startsWith('rate_limit:')) {
                const keyWindow = parseInt(storeKey.split(':')[2])

                if (keyWindow < currentWindow - 1) {
                    this.fallbackStore.delete(storeKey)
                }
            }
        }
    }

    /**
     * Get current rate limit status for a client IP
     * @param clientIp - Client IP address to check status for
     * @param windowMs - Time window in milliseconds to check
     * @returns Promise resolving to current request count in the time window
     * @throws Will not throw, returns 0 on errors
     */
    async getRateLimitStatus(clientIp: string, windowMs: number): Promise<number> {

        const now = Date.now()
        const windowKey = Math.floor(now / windowMs)
        const key = `rate_limit:${clientIp}:${windowKey}`

        try {
            if (this.redis && this.redis.status === 'ready') {
                const count = await this.redis.get(key)
                return count ? parseInt(count, 10) : 0
            } else {
                return this.fallbackStore.get(key) || 0
            }

        } catch (error) {
            this.logger.error('Failed to get rate limit status:', error.message)
            return 0
        }
    }

    /**
     * Reset rate limit for a specific client IP (admin function)
     * @param clientIp - Client IP address to reset limits for
     * @param windowMs - Time window in milliseconds to reset
     * @returns Promise that resolves when reset is complete
     * @throws Will not throw, errors are logged
     */
    async resetRateLimit(clientIp: string, windowMs: number): Promise<void> {

        const now = Date.now()
        const windowKey = Math.floor(now / windowMs)
        const key = `rate_limit:${clientIp}:${windowKey}`

        try {
            if (this.redis && this.redis.status === 'ready') {
                await this.redis.del(key)
            } else {
                this.fallbackStore.delete(key)
            }

            this.logger.log(`Rate limit reset for IP: ${clientIp}`)

        } catch (error) {
            this.logger.error('Failed to reset rate limit:', error.message)
        }
    }

    /**
     * Health check for Redis connection
     * @returns Promise resolving to true if Redis is connected and ready, false otherwise
     * @throws Will not throw, returns false on connection errors
     */
    async isHealthy(): Promise<boolean> {

        try {
            if (this.redis && this.redis.status === 'ready') {
                await this.redis.ping()
                return true
            }

            return false
        } catch {
            return false
        }
    }

    /**
     * Graceful shutdown handler
     * Closes Redis connection and performs cleanup
     * @returns Promise that resolves when shutdown is complete
     * @throws Will not throw, errors are logged
     */
    async onModuleDestroy(): Promise<void> {

        if (this.redis) {
            try {
                await this.redis.quit()
                this.logger.log('Redis connection closed')
            } catch (error) {
                this.logger.error('Error closing Redis connection:', error.message)
            }
        }
    }
}