import {CanActivate, ExecutionContext, Injectable, ForbiddenException, BadRequestException} from '@nestjs/common'
import {Observable} from 'rxjs'
import {Request} from 'express'

/**
 * Security guard that implements various security checks and validations for incoming HTTP requests.
 * Provides protection against common web vulnerabilities including SQL injection, XSS, command injection,
 * path traversal attempts, and suspicious request patterns.
 */
@Injectable()
export class SecurityGuard implements CanActivate {

    /**
     * Regular expression patterns to detect various types of malicious content
     * including SQL injection, XSS, command injection, path traversal, LDAP injection,
     * XML/XXE patterns, and NoSQL injection attempts
     */
    private readonly suspiciousPatterns = [

        // SQL Injection patterns
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
        /('|(\\x27)|(\\x2D){2})/,

        // XSS patterns
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/i,
        /vbscript:/i,
        /onload|onerror|onclick|onmouseover|onmouseout|onfocus|onblur/i,

        // Command injection
        /(\bnc\s+|netcat\s+|wget\s+|curl\s+|bash\s+|\/bin\/sh|cmd\.exe|powershell\.exe|\bexec\s*\()/i,

        // Path traversal
        /(\.\.\/|\.\.\\)/,
        /(%2e%2e%2f|%2e%2e%5c)/i,

        // LDAP injection disabled for FHIR compatibility (pipes are legitimate in FHIR identifiers)
        // /\(\s*\|\s*\(\s*\w+\s*=\s*\*\s*\)\s*\(\s*\w+\s*=\s*\*\s*\)\s*\)/

        // XML/XXE patterns (refined to avoid false positives with FHIR NamingSystem)
        /<!ENTITY/i,
        /<!DOCTYPE.*SYSTEM/i,
        /<!DOCTYPE.*PUBLIC/i,

        // NoSQL injection
        /\\b(\\$where|\\$ne|\\$in|\\$nin|\\$or|\\$and|\\$not|\\$nor|\\$exists|\\$type|\\$mod|\\$regex|\\$text|\\$search)\\b/i
    ]

    /**
     * List of HTTP headers that are blocked to prevent request forgery attempts
     */
    private readonly blockedHeaders = [
        'x-forwarded-host',
        'x-original-url',
        'x-rewrite-url'
    ]

    /** Maximum allowed request size in bytes (10MB) */
    private readonly maxRequestSize = 10 * 1024 * 1024 // 50MB

    /** Maximum allowed header size in bytes (8KB) */
    private readonly maxHeaderSize = 8 * 1024 // 8KB

    /** Maximum allowed URL length in characters */
    private readonly maxUrlLength = 2048

    /** Maximum allowed number of headers in a request */
    private readonly maxHeaderCount = 50

    /**
     * Implements the CanActivate interface to perform security checks on incoming requests
     * @param context - The execution context containing the request
     * @returns True if all security checks pass, false otherwise
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const request: Request = context.switchToHttp().getRequest()

        try {

            this.validateRequestSize(request)
            this.validateHeaders(request)
            this.validateUrl(request)
            this.validateUserAgent(request)
            this.checkForSuspiciousPatterns(request)
            this.validateContentType(request)
            this.checkRateLimiting(request)

            return true

        } catch (error) {
            throw new ForbiddenException(error instanceof Error ? error.message : 'Security check failed')
        }
    }

    /**
     * Validates the size of the incoming request against maxRequestSize
     * @param request - The incoming HTTP request
     * @throws {BadRequestException} If the request size exceeds maxRequestSize
     */
    private validateRequestSize(request: Request): void {

        const contentLength = parseInt(request.headers['content-length'] || '0')

        if (contentLength > this.maxRequestSize) {
            throw new BadRequestException('Request too large')
        }
    }

    /**
     * Validates request headers for size, count, blocked headers, and suspicious content
     * @param request - The incoming HTTP request
     * @throws {BadRequestException} If header validation fails
     * @throws {ForbiddenException} If suspicious or blocked headers are detected
     */
    private validateHeaders(request: Request): void {

        const headerCount = Object.keys(request.headers).length

        if (headerCount > this.maxHeaderCount) {
            throw new BadRequestException('Too many headers')
        }

        for (const [name, value] of Object.entries(request.headers)) {

            if (typeof value === 'string' && value.length > this.maxHeaderSize) {
                throw new BadRequestException('Header too large')
            }

            if (this.blockedHeaders.includes(name.toLowerCase())) {
                throw new ForbiddenException('Blocked header detected')
            }

            if (typeof value === 'string' && this.containsSuspiciousPattern(value)) {
                throw new ForbiddenException(`Suspicious header content detected: ${name} = ${value}`)
            }
        }
    }

    /**`````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````
     * Validates the request URL for length, suspicious patterns, and path traversal attempts
     * @param request - The incoming HTTP request
     * @throws {BadRequestException} If URL is too long
     * @throws {ForbiddenException} If suspicious patterns or path traversal attempts are detected
     */
    private validateUrl(request: Request): void {

        const fullUrl = request.protocol + '://' + request.get('host') + request.originalUrl

        if (fullUrl.length > this.maxUrlLength) {
            throw new BadRequestException('URL too long')
        }

        if (this.containsSuspiciousPattern(request.originalUrl)) {
            throw new ForbiddenException('Suspicious URL pattern detected')
        }

        if (request.originalUrl.includes('..') || request.originalUrl.includes('%2e%2e')) {
            throw new ForbiddenException('Path traversal attempt detected')
        }
    }

    /**
     * Validates the User-Agent header for known malicious patterns
     * @param request - The incoming HTTP request
     * @throws {ForbiddenException} If suspicious user agent is detected
     */
    private validateUserAgent(request: Request): void {

        const userAgent = request.headers['user-agent']

        if (typeof userAgent === 'string') {

            const suspiciousUAPatterns = [/sqlmap/i, /nmap/i, /nikto/i, /scanner/i, /bot.*bot/i, /crawler.*crawler/i]

            if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
                throw new ForbiddenException('Suspicious user agent detected')
            }
        }
    }

    /**
     * Checks request query parameters, body, and params for suspicious patterns
     * @param request - The incoming HTTP request
     * @throws {ForbiddenException} If suspicious patterns are detected
     */
    private checkForSuspiciousPatterns(request: Request): void {

        const checkString = JSON.stringify({
            query: request.query,
            body: request.body,
            params: request.params
        })

        if (this.containsSuspiciousPattern(checkString)) {
            throw new ForbiddenException('Suspicious content detected')
        }
    }

    /**
     * Validates the Content-Type header for POST, PUT, and PATCH requests
     * @param request - The incoming HTTP request
     * @throws {BadRequestException} If content type is not supported
     */
    private validateContentType(request: Request): void {

        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {

            const contentType = request.headers['content-type']

            if (contentType) {

                const allowedTypes = [
                    'application/json',
                    'application/fhir+json',
                    'application/xml',
                    'application/fhir+xml',
                    'text/plain',
                    'multipart/form-data',
                    'application/x-www-form-urlencoded'
                ]

                const isAllowed = allowedTypes.some(type =>
                    contentType.toLowerCase().startsWith(type)
                )

                if (!isAllowed) {
                    throw new BadRequestException('Unsupported content type')
                }
            }
        }
    }

    /**
     * Implements basic in-memory rate limiting per client IP
     * @param request - The incoming HTTP request
     * @throws {ForbiddenException} If rate limit is exceeded
     */
    private checkRateLimiting(request: Request): void {

        const clientIp = this.getClientIp(request)
        const now = Date.now()
        const windowMs = 15 * 60 * 1000 // 15 minutes
        const maxRequests = 100

        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map()
        }

        const key = `${clientIp}:${Math.floor(now / windowMs)}`
        const current = global.rateLimitStore.get(key) || 0

        if (current >= maxRequests) {
            throw new ForbiddenException('Rate limit exceeded')
        }

        global.rateLimitStore.set(key, current + 1)

        const currentWindow = Math.floor(now / windowMs)

        for (const [storeKey] of global.rateLimitStore) {
            const keyWindow = parseInt(storeKey.split(':')[1])

            if (keyWindow < currentWindow - 1) {
                global.rateLimitStore.delete(storeKey)
            }
        }
    }

    /**
     * Extracts the client IP address from various request headers and connection information
     * @param request - The incoming HTTP request
     * @returns The client IP address or 127.0.0.1 if not found
     */
    private getClientIp(request: Request): string {

        return (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (request.headers['x-real-ip'] as string) ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            '127.0.0.1'
    }

    /**
     * Checks if the input string contains any suspicious patterns defined in suspiciousPatterns
     * @param input - The string to check for suspicious patterns
     * @returns True if suspicious patterns are found, false otherwise
     */
    private containsSuspiciousPattern(input: string): boolean {

        if (!input) return false

        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(input)) {
                console.log(`Pattern matched: ${pattern.source}`)
                console.log(`Input excerpt: ${input.substring(0, 200)}...`)
                return true
            }
        }

        return false
    }
}