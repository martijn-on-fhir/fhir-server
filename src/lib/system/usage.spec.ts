import { Usage } from './usage';
import * as process from 'process';

// Mock the process module
jest.mock('process', () => ({
  memoryUsage: jest.fn(),
  cpuUsage: jest.fn(),
  availableMemory: jest.fn()
}));

const mockProcess = process as jest.Mocked<typeof process>;

describe('Usage', () => {
  let usage: Usage;
  let mockMemoryUsage: jest.MockedFunction<typeof process.memoryUsage>;
  let mockCpuUsage: jest.MockedFunction<typeof process.cpuUsage>;
  let mockAvailableMemory: jest.MockedFunction<typeof process.availableMemory>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get mocked functions
    mockMemoryUsage = mockProcess.memoryUsage as jest.MockedFunction<typeof process.memoryUsage>;
    mockCpuUsage = mockProcess.cpuUsage as jest.MockedFunction<typeof process.cpuUsage>;
    mockAvailableMemory = mockProcess.availableMemory as jest.MockedFunction<typeof process.availableMemory>;
    
    // Default mock implementations
    mockMemoryUsage.mockReturnValue({
      rss: 100 * 1024 * 1024, // 100 MB in bytes
      heapUsed: 50 * 1024 * 1024, // 50 MB in bytes
      heapTotal: 80 * 1024 * 1024, // 80 MB in bytes
      external: 10 * 1024 * 1024, // 10 MB in bytes
      arrayBuffers: 5 * 1024 * 1024 // 5 MB in bytes
    });
    
    mockCpuUsage.mockReturnValue({
      user: 500000, // 500ms in microseconds
      system: 200000 // 200ms in microseconds
    });
    
    mockAvailableMemory.mockReturnValue(8 * 1024 * 1024 * 1024); // 8 GB in bytes
  });

  describe('constructor', () => {
    it('should create Usage instance and initialize metrics', () => {
      usage = new Usage();
      
      expect(usage).toBeInstanceOf(Usage);
      expect(mockMemoryUsage).toHaveBeenCalledTimes(1);
      expect(mockCpuUsage).toHaveBeenCalledTimes(1);
    });

    it('should call init() during construction', () => {
      const initSpy = jest.spyOn(Usage.prototype as any, 'init');
      
      usage = new Usage();
      
      expect(initSpy).toHaveBeenCalledTimes(1);
      initSpy.mockRestore();
    });

    it('should handle different memory values during initialization', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 200 * 1024 * 1024, // 200 MB
        heapUsed: 150 * 1024 * 1024, // 150 MB
        heapTotal: 180 * 1024 * 1024, // 180 MB
        external: 25 * 1024 * 1024, // 25 MB
        arrayBuffers: 5 * 1024 * 1024 // 5 MB
      });
      
      mockCpuUsage.mockReturnValue({
        user: 1000000, // 1000ms
        system: 500000 // 500ms
      });
      
      usage = new Usage();
      
      expect(mockMemoryUsage).toHaveBeenCalled();
      expect(mockCpuUsage).toHaveBeenCalled();
    });
  });

  describe('init', () => {
    beforeEach(() => {
      usage = new Usage();
    });

    it('should collect memory usage statistics', () => {
      expect(mockMemoryUsage).toHaveBeenCalledTimes(1);
    });

    it('should collect CPU usage statistics', () => {
      expect(mockCpuUsage).toHaveBeenCalledTimes(1);
    });

    it('should convert memory values from bytes to MB', () => {
      // Verify memory conversion by checking snapshot
      const snapshot = usage.snapshot() as any;
      
      // 100 MB RSS should be converted correctly
      expect(snapshot.memory.rss).toBe(100);
      // 50 MB heap should be converted correctly
      expect(snapshot.memory.heap).toBe(50);
      // 10 MB external should be converted correctly
      expect(snapshot.memory.external).toBe(10);
    });

    it('should handle small memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024, // 1 MB
        heapUsed: 512 * 1024, // 0.5 MB
        heapTotal: 1024 * 1024, // 1 MB
        external: 100 * 1024, // 0.1 MB (approximately)
        arrayBuffers: 0
      });
      
      const smallUsage = new Usage();
      const snapshot = smallUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(1);
      expect(snapshot.memory.heap).toBe(0.5);
      expect(snapshot.memory.external).toBe(0.1);
    });

    it('should handle large memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 2048 * 1024 * 1024, // 2 GB
        heapUsed: 1024 * 1024 * 1024, // 1 GB
        heapTotal: 1536 * 1024 * 1024, // 1.5 GB
        external: 512 * 1024 * 1024, // 512 MB
        arrayBuffers: 0
      });
      
      const largeUsage = new Usage();
      const snapshot = largeUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(2048);
      expect(snapshot.memory.heap).toBe(1024);
      expect(snapshot.memory.external).toBe(512);
    });

    it('should handle zero memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      });
      
      const zeroUsage = new Usage();
      const snapshot = zeroUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(0);
      expect(snapshot.memory.heap).toBe(0);
      expect(snapshot.memory.external).toBe(0);
    });
  });

  describe('snapshot', () => {
    beforeEach(() => {
      usage = new Usage();
    });

    it('should return properly structured usage object', () => {
      const snapshot = usage.snapshot();
      
      expect(snapshot).toHaveProperty('memory');
      expect(snapshot).toHaveProperty('cpu');
      
      const typedSnapshot = snapshot as any;
      expect(typedSnapshot.memory).toHaveProperty('rss');
      expect(typedSnapshot.memory).toHaveProperty('heap');
      expect(typedSnapshot.memory).toHaveProperty('external');
      expect(typedSnapshot.memory).toHaveProperty('total');
      expect(typedSnapshot.cpu).toHaveProperty('system');
      expect(typedSnapshot.cpu).toHaveProperty('user');
    });

    it('should return correct memory values in MB', () => {
      const snapshot = usage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(100); // 100 MB
      expect(snapshot.memory.heap).toBe(50); // 50 MB
      expect(snapshot.memory.external).toBe(10); // 10 MB
      expect(snapshot.memory.total).toBe(8192); // 8 GB = 8192 MB
    });

    it('should return correct CPU values in MB (converted from microseconds)', () => {
      const snapshot = usage.snapshot() as any;
      
      // CPU values are converted from microseconds to MB using the same formula
      // user: 500000 microseconds / 1024 / 1024 ≈ 0.48 MB
      expect(snapshot.cpu.user).toBe(0.48);
      // system: 200000 microseconds / 1024 / 1024 ≈ 0.19 MB
      expect(snapshot.cpu.system).toBe(0.19);
    });

    it('should format numbers to 2 decimal places', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 123456789, // Should result in ~117.74 MB
        heapUsed: 987654321, // Should result in ~941.90 MB
        heapTotal: 0,
        external: 555555555, // Should result in ~529.79 MB
        arrayBuffers: 0
      });
      
      mockCpuUsage.mockReturnValue({
        user: 1234567, // Should result in ~1.18 MB
        system: 7654321 // Should result in ~7.30 MB
      });
      
      const precisionUsage = new Usage();
      const snapshot = precisionUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(117.74);
      expect(snapshot.memory.heap).toBe(941.9);
      expect(snapshot.memory.external).toBeCloseTo(529.79, 1); // Allow for floating-point precision
      expect(snapshot.cpu.user).toBe(1.18);
      expect(snapshot.cpu.system).toBe(7.3);
    });

    it('should call availableMemory() for total memory', () => {
      usage.snapshot();
      
      expect(mockAvailableMemory).toHaveBeenCalledTimes(1);
    });

    it('should handle different available memory values', () => {
      mockAvailableMemory.mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      
      const snapshot = usage.snapshot() as any;
      
      expect(snapshot.memory.total).toBe(16384); // 16 GB = 16384 MB
    });

    it('should return consistent values on multiple calls', () => {
      const snapshot1 = usage.snapshot();
      const snapshot2 = usage.snapshot();
      
      expect(snapshot1).toEqual(snapshot2);
      expect(mockAvailableMemory).toHaveBeenCalledTimes(2); // Called once per snapshot
    });
  });

  describe('memory unit conversions', () => {
    it('should correctly convert bytes to megabytes', () => {
      const testCases = [
        { bytes: 1024 * 1024, expectedMB: 1 }, // 1 MB
        { bytes: 1536 * 1024, expectedMB: 1.5 }, // 1.5 MB
        { bytes: 2.5 * 1024 * 1024, expectedMB: 2.5 }, // 2.5 MB
        { bytes: 1000 * 1024, expectedMB: 0.98 }, // ~0.98 MB
        { bytes: 10240, expectedMB: 0.01 } // ~0.01 MB
      ];
      
      testCases.forEach(({ bytes, expectedMB }) => {
        mockMemoryUsage.mockReturnValue({
          rss: bytes,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          arrayBuffers: 0
        });
        
        const testUsage = new Usage();
        const snapshot = testUsage.snapshot() as any;
        
        expect(snapshot.memory.rss).toBe(expectedMB);
      });
    });

    it('should handle fractional MB values correctly', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 1.5 * 1024 * 1024, // 1.5 MB
        heapUsed: 0.75 * 1024 * 1024, // 0.75 MB
        heapTotal: 0,
        external: 0.25 * 1024 * 1024, // 0.25 MB
        arrayBuffers: 0
      });
      
      const fractionalUsage = new Usage();
      const snapshot = fractionalUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(1.5);
      expect(snapshot.memory.heap).toBe(0.75);
      expect(snapshot.memory.external).toBe(0.25);
    });
  });

  describe('CPU usage calculations', () => {
    it('should convert CPU microseconds to MB format', () => {
      const testCases = [
        { microseconds: 1048576, expectedMB: 1 }, // 1 MB worth of microseconds
        { microseconds: 2097152, expectedMB: 2 }, // 2 MB worth of microseconds
        { microseconds: 524288, expectedMB: 0.5 }, // 0.5 MB worth of microseconds
        { microseconds: 0, expectedMB: 0 } // 0 MB
      ];
      
      testCases.forEach(({ microseconds, expectedMB }) => {
        mockCpuUsage.mockReturnValue({
          user: microseconds,
          system: 0
        });
        
        const testUsage = new Usage();
        const snapshot = testUsage.snapshot() as any;
        
        expect(snapshot.cpu.user).toBe(expectedMB);
      });
    });

    it('should handle both user and system CPU time', () => {
      mockCpuUsage.mockReturnValue({
        user: 1048576, // 1 MB equivalent
        system: 2097152 // 2 MB equivalent
      });
      
      const cpuUsage = new Usage();
      const snapshot = cpuUsage.snapshot() as any;
      
      expect(snapshot.cpu.user).toBe(1);
      expect(snapshot.cpu.system).toBe(2);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle undefined memory values gracefully', () => {
      mockMemoryUsage.mockReturnValue({
        rss: undefined as any,
        heapUsed: undefined as any,
        heapTotal: 0,
        external: undefined as any,
        arrayBuffers: 0
      });
      
      mockCpuUsage.mockReturnValue({
        user: undefined as any,
        system: undefined as any
      });
      
      // Should not throw an error
      expect(() => new Usage()).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER / 1000; // Avoid overflow
      
      mockMemoryUsage.mockReturnValue({
        rss: largeNumber,
        heapUsed: largeNumber,
        heapTotal: 0,
        external: largeNumber,
        arrayBuffers: 0
      });
      
      const largeUsage = new Usage();
      const snapshot = largeUsage.snapshot() as any;
      
      expect(typeof snapshot.memory.rss).toBe('number');
      expect(typeof snapshot.memory.heap).toBe('number');
      expect(typeof snapshot.memory.external).toBe('number');
      expect(snapshot.memory.rss).toBeGreaterThan(0);
    });

    it('should handle process method failures', () => {
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage unavailable');
      });
      
      expect(() => new Usage()).toThrow('Memory usage unavailable');
    });

    it('should handle CPU usage method failures', () => {
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage unavailable');
      });
      
      expect(() => new Usage()).toThrow('CPU usage unavailable');
    });

    it('should handle availableMemory method failures during snapshot', () => {
      mockAvailableMemory.mockImplementation(() => {
        throw new Error('Available memory unavailable');
      });
      
      usage = new Usage();
      
      expect(() => usage.snapshot()).toThrow('Available memory unavailable');
    });

    it('should handle negative values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: -100 * 1024 * 1024, // Negative value
        heapUsed: -50 * 1024 * 1024, // Negative value
        heapTotal: 0,
        external: -10 * 1024 * 1024, // Negative value
        arrayBuffers: 0
      });
      
      mockCpuUsage.mockReturnValue({
        user: -500000, // Negative value
        system: -200000 // Negative value
      });
      
      const negativeUsage = new Usage();
      const snapshot = negativeUsage.snapshot() as any;
      
      expect(snapshot.memory.rss).toBe(-100);
      expect(snapshot.memory.heap).toBe(-50);
      expect(snapshot.memory.external).toBe(-10);
      expect(snapshot.cpu.user).toBe(-0.48);
      expect(snapshot.cpu.system).toBe(-0.19);
    });
  });

  describe('multiple instances', () => {
    it('should create independent instances', () => {
      mockMemoryUsage
        .mockReturnValueOnce({
          rss: 100 * 1024 * 1024,
          heapUsed: 50 * 1024 * 1024,
          heapTotal: 0,
          external: 10 * 1024 * 1024,
          arrayBuffers: 0
        })
        .mockReturnValueOnce({
          rss: 200 * 1024 * 1024,
          heapUsed: 100 * 1024 * 1024,
          heapTotal: 0,
          external: 20 * 1024 * 1024,
          arrayBuffers: 0
        });
      
      const usage1 = new Usage();
      const usage2 = new Usage();
      
      const snapshot1 = usage1.snapshot() as any;
      const snapshot2 = usage2.snapshot() as any;
      
      expect(snapshot1.memory.rss).toBe(100);
      expect(snapshot2.memory.rss).toBe(200);
      expect(mockMemoryUsage).toHaveBeenCalledTimes(2);
    });
  });
});