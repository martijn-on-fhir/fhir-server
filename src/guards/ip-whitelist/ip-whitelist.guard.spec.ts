import {ConfigService} from '@nestjs/config'
import {ExecutionContext, ForbiddenException} from '@nestjs/common'
import {IpWhitelistGuard} from './ip-whitelist.guard'

describe('IpWhitelistGuard', () => {
  let configService: jest.Mocked<ConfigService>
  let mockRequest: any
  let mockExecutionContext: jest.Mocked<ExecutionContext>

  beforeEach(async () => {
    // Mock ConfigService
    configService = {
      get: jest.fn()
    } as any

    // Mock request object
    mockRequest = {
      ip: '',
      connection: { remoteAddress: '' },
      socket: { remoteAddress: '' },
      headers: {},
      method: 'GET',
      url: '/test'
    }

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest)
      })
    } as any
  })

  describe('Disabled Configuration', () => {
    let guard: IpWhitelistGuard

    beforeEach(() => {
      configService.get.mockReturnValue({
        enabled: false,
        allowedIPs: [],
        allowLocalhost: true,
        logBlockedAttempts: false
      })
      guard = new IpWhitelistGuard(configService)
    })

    it('should allow all requests when disabled', () => {
      mockRequest.ip = '192.168.1.100'
      
      const result = guard.canActivate(mockExecutionContext)
      
      expect(result).toBe(true)
    })

    it('should have correct stats when disabled', () => {
      const stats = guard.getWhitelistStats()
      
      expect(stats.enabled).toBe(false)
    })
  })

  describe('Enabled Configuration', () => {
    let guard: IpWhitelistGuard

    beforeEach(() => {
      configService.get.mockReturnValue({
        enabled: true,
        allowedIPs: [
          '192.168.1.1',
          '10.0.0.0/8',
          '203.0.113.0/24',
          '2001:db8::/32'
        ],
        allowLocalhost: true,
        logBlockedAttempts: false
      })
      guard = new IpWhitelistGuard(configService)
    })

    describe('Individual IP Addresses', () => {
      it('should allow specifically whitelisted IPv4 address', () => {
        mockRequest.ip = '192.168.1.1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should allow localhost when allowLocalhost is true', () => {
        mockRequest.ip = '127.0.0.1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should allow IPv6 localhost', () => {
        mockRequest.ip = '::1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should block non-whitelisted IPv4 address', () => {
        mockRequest.ip = '192.168.2.1'
        
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })
    })

    describe('CIDR Range Support', () => {
      it('should allow IP within CIDR range 10.0.0.0/8', () => {
        mockRequest.ip = '10.50.100.150'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should allow IP at start of CIDR range', () => {
        mockRequest.ip = '10.0.0.1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should allow IP at end of CIDR range', () => {
        mockRequest.ip = '10.255.255.254'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should block IP outside CIDR range', () => {
        mockRequest.ip = '11.0.0.1'
        
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })

      it('should allow IP within /24 CIDR range', () => {
        mockRequest.ip = '203.0.113.100'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should block IP outside /24 CIDR range', () => {
        mockRequest.ip = '203.0.114.1'
        
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })
    })

    describe('IPv6 Support', () => {
      it('should allow IPv6 address within CIDR range', () => {
        mockRequest.ip = '2001:db8::1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should block IPv6 address outside CIDR range', () => {
        mockRequest.ip = '2001:db9::1'
        
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })
    })

    describe('IP Source Detection', () => {
      it('should use request.ip as primary source', () => {
        mockRequest.ip = '192.168.1.1'
        mockRequest.headers = { 'x-forwarded-for': '192.168.2.1' }
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should fallback to connection.remoteAddress', () => {
        mockRequest.ip = undefined
        mockRequest.connection = { remoteAddress: '192.168.1.1' }
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should fallback to x-forwarded-for header', () => {
        mockRequest.ip = undefined
        mockRequest.connection = {}
        mockRequest.headers = { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should fallback to x-real-ip header', () => {
        mockRequest.ip = undefined
        mockRequest.connection = {}
        mockRequest.headers = { 'x-real-ip': '192.168.1.1' }
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should throw error when IP cannot be determined', () => {
        mockRequest.ip = undefined
        mockRequest.connection = {}
        mockRequest.socket = {}
        mockRequest.headers = {}
        
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
        expect(() => guard.canActivate(mockExecutionContext))
          .toThrow('Unable to determine client IP')
      })
    })

    describe('Configuration Edge Cases', () => {
      it('should handle invalid IP configurations gracefully', () => {
        configService.get.mockReturnValue({
          enabled: true,
          allowedIPs: [
            'invalid-ip',
            '192.168.1.1', // This should still work
            '256.256.256.256' // Invalid IP
          ],
          allowLocalhost: false,
          logBlockedAttempts: false
        })
        
        const testGuard = new IpWhitelistGuard(configService)
        mockRequest.ip = '192.168.1.1'
        
        const result = testGuard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })

      it('should handle empty IP list configuration', () => {
        configService.get.mockReturnValue({
          enabled: true,
          allowedIPs: [],
          allowLocalhost: false,
          logBlockedAttempts: false
        })
        
        const testGuard = new IpWhitelistGuard(configService)
        mockRequest.ip = '192.168.1.1'
        
        expect(() => testGuard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })
    })

    describe('Localhost Handling', () => {
      it('should block localhost when allowLocalhost is false', () => {
        configService.get.mockReturnValue({
          enabled: true,
          allowedIPs: ['192.168.1.1'],
          allowLocalhost: false,
          logBlockedAttempts: false
        })
        
        const testGuard = new IpWhitelistGuard(configService)
        mockRequest.ip = '127.0.0.1'
        
        expect(() => testGuard.canActivate(mockExecutionContext))
          .toThrow(ForbiddenException)
      })

      it('should handle IPv4-mapped IPv6 localhost', () => {
        mockRequest.ip = '::ffff:127.0.0.1'
        
        const result = guard.canActivate(mockExecutionContext)
        
        expect(result).toBe(true)
      })
    })
  })

  describe('Utility Methods', () => {
    let guard: IpWhitelistGuard

    beforeEach(() => {
      configService.get.mockReturnValue({
        enabled: true,
        allowedIPs: ['192.168.1.1', '10.0.0.0/8'],
        allowLocalhost: true,
        logBlockedAttempts: true
      })
      guard = new IpWhitelistGuard(configService)
    })

    it('should return configuration via getConfig()', () => {
      const config = guard.getConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.allowLocalhost).toBe(true)
      expect(config.logBlockedAttempts).toBe(true)
      expect(config.allowedIPs).toEqual(['192.168.1.1', '10.0.0.0/8'])
    })

    it('should return whitelist statistics', () => {
      const stats = guard.getWhitelistStats()
      
      expect(stats.enabled).toBe(true)
      expect(stats.individualIPs).toBeGreaterThan(0) // At least localhost IPs
      expect(stats.cidrRanges).toBe(1) // 10.0.0.0/8
    })

    it('should return immutable config object', () => {
      const config = guard.getConfig() as any
      
      expect(() => {
        config.enabled = false
      }).toThrow()
    })
  })

  describe('Error Handling', () => {
    let guard: IpWhitelistGuard

    beforeEach(() => {
      configService.get.mockReturnValue({
        enabled: true,
        allowedIPs: ['192.168.1.1'],
        allowLocalhost: false,
        logBlockedAttempts: false
      })
      guard = new IpWhitelistGuard(configService)
    })

    it('should handle malformed IP addresses gracefully', () => {
      mockRequest.ip = 'not-an-ip'
      
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(ForbiddenException)
    })

    it('should handle empty IP string', () => {
      mockRequest.ip = ''
      
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException with correct message for blocked IP', () => {
      mockRequest.ip = '192.168.2.1'
      
      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow('Access denied: IP not in whitelist')
    })
  })

  describe('Default Configuration', () => {
    it('should use default configuration when none provided', () => {
      configService.get.mockReturnValue(undefined)
      
      const guard = new IpWhitelistGuard(configService)
      mockRequest.ip = '192.168.1.1'
      
      // Should allow since default is disabled
      const result = guard.canActivate(mockExecutionContext)
      expect(result).toBe(true)
    })
  })
})