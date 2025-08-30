import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import * as ipaddr from 'ipaddr.js'
import {FsLoggerService} from "../../services/logger/fs-logger.service";

interface IpWhitelistConfig {
  enabled: boolean
  allowedIPs: string[]
  allowLocalhost: boolean
  logBlockedAttempts: boolean
}

/**
 * Guard that restricts access based on client IP address whitelist
 * Supports individual IPs, CIDR ranges, and IPv6 addresses
 * Configuration is loaded from the application config file
 */
@Injectable()
export class IpWhitelistGuard implements CanActivate {

  private readonly config: IpWhitelistConfig
  private readonly allowedIPs: Set<string> = new Set()
  private readonly allowedRanges: Array<{ network: any; prefix: number }> = []

  constructor(private readonly configService: ConfigService, private readonly logger: FsLoggerService) {

    const defaultConfig: IpWhitelistConfig = {
      enabled: false,
      allowedIPs: [],
      allowLocalhost: true,
      logBlockedAttempts: true
    }
    
    this.config = this.configService.get<IpWhitelistConfig>('security.ipWhitelist', defaultConfig) || defaultConfig
    this.initializeAllowedIPs()
    this.logger.log(`IP Whitelist Guard initialized: ${this.config.enabled ? 'ENABLED' : 'DISABLED'}`)
  }

  /**
   * Initialize and parse allowed IPs and CIDR ranges from configuration
   */
  private initializeAllowedIPs(): void {
    if (!this.config.enabled) {
      return
    }

    // Add localhost IPs if enabled
    if (this.config.allowLocalhost) {

      this.allowedIPs.add('127.0.0.1')
      this.allowedIPs.add('::1')
      this.allowedIPs.add('::ffff:127.0.0.1') // IPv4-mapped IPv6
    }

    // Process configured IPs
    for (const ipEntry of this.config.allowedIPs) {

      try {

        if (this.isCIDR(ipEntry)) {
          // Parse CIDR range
          const [networkAddr, prefixStr] = ipEntry.split('/')
          const prefix = parseInt(prefixStr, 10)
          const network = ipaddr.process(networkAddr)
          
          this.allowedRanges.push({ network, prefix })
          this.logger.debug(`Added CIDR range: ${ipEntry}`)

        } else {
          // Single IP address
          const processedIP = ipaddr.process(ipEntry).toString()
          this.allowedIPs.add(processedIP)
          this.logger.debug(`Added IP: ${processedIP}`)
        }
      } catch (error) {
        this.logger.error(`Invalid IP configuration entry: ${ipEntry}`, error)
      }
    }

    this.logger.log(`Loaded ${this.allowedIPs.size} individual IPs and ${this.allowedRanges.length} CIDR ranges`)
  }

  /**
   * Check if IP string contains CIDR notation
   */
  private isCIDR(ip: string): boolean {
    return ip.includes('/')
  }

  /**
   * Extract client IP address from request, handling proxies
   */
  private getClientIP(request: Request): string {
    // Priority order for getting real client IP
    return (
      request.ip || // Express with trust proxy
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      (request.connection as any)?.socket?.remoteAddress ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.headers['x-real-ip']?.toString() ||
      'unknown'
    )
  }

  /**
   * Check if IP is allowed based on whitelist rules
   */
  private isIPAllowed(clientIP: string): boolean {

    try {
      const processedIP = ipaddr.process(clientIP)
      const ipString = processedIP.toString()

      // Check exact IP matches
      if (this.allowedIPs.has(ipString)) {
        return true
      }

      // Check CIDR ranges
      for (const { network, prefix } of this.allowedRanges) {
        try {
          if (processedIP.kind() === network.kind()) {
            if (processedIP.match(network, prefix)) {
              return true
            }
          }
        } catch (error) {
          this.logger.debug(`Error checking CIDR range: ${error.message}`)
        }
      }

      return false

    } catch (error) {

      this.logger.debug(`Error processing IP ${clientIP}: ${error.message}`)
      return false
    }
  }

  /**
   * Guard activation check - returns true if request should be allowed
   */
  canActivate(context: ExecutionContext): boolean {

    // Skip if IP whitelist is disabled
    if (!this.config.enabled) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const clientIP = this.getClientIP(request)

    if (clientIP === 'unknown') {

      if (this.config.logBlockedAttempts) {
        this.logger.warn(`Request blocked: Could not determine client IP`)
      }

      throw new ForbiddenException('Access denied: Unable to determine client IP')
    }

    const isAllowed = this.isIPAllowed(clientIP)

    if (!isAllowed) {

      if (this.config.logBlockedAttempts) {
        this.logger.warn(`Access denied for IP: ${clientIP} on ${request.method} ${request.url}`)
      }

      throw new ForbiddenException('Access denied: IP not in whitelist')
    }

    this.logger.debug(`Access granted for IP: ${clientIP}`)

      return true
  }

  /**
   * Get current whitelist configuration (for debugging/monitoring)
   */
  getConfig(): Readonly<IpWhitelistConfig> {
    return Object.freeze({ ...this.config })
  }

  /**
   * Get count of allowed IPs and ranges (for monitoring)
   */
  getWhitelistStats(): { individualIPs: number; cidrRanges: number; enabled: boolean } {
    return {
      individualIPs: this.allowedIPs.size,
      cidrRanges: this.allowedRanges.length,
      enabled: this.config.enabled
    }
  }
}