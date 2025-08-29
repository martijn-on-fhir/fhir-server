import { Backup } from './backup';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn()
  }
}));
jest.mock('path');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockJoin = join as jest.MockedFunction<typeof join>;

describe('Backup', () => {
  let backup: Backup;
  let mockConfig: any;
  let mockChildProcess: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const testDirectory = '/test/backup/directory';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock config
    mockConfig = {
      host: 'localhost',
      port: 27017,
      database: 'fhir-test',
      username: 'testuser',
      password: 'testpass'
    };
    
    // Mock child process
    mockChildProcess = new EventEmitter();
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    
    // Default mock implementations
    mockSpawn.mockReturnValue(mockChildProcess as any);
    mockJoin.mockImplementation((...paths) => paths.join('/'));
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined as any);
    mockFs.writeFile.mockResolvedValue(undefined);
    
    // Create backup instance
    backup = new Backup(testDirectory, mockConfig);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create Backup instance with directory and config', () => {
      expect(backup.directory).toBe(testDirectory);
      expect(backup.config).toBe(mockConfig);
    });

    it('should handle empty config object', () => {
      const emptyConfig = {};
      const backupWithEmptyConfig = new Backup(testDirectory, emptyConfig);
      
      expect(backupWithEmptyConfig.directory).toBe(testDirectory);
      expect(backupWithEmptyConfig.config).toBe(emptyConfig);
    });

    it('should handle different directory paths', () => {
      const windowsPath = 'C:\\backup\\windows';
      const unixPath = '/backup/unix';
      
      const windowsBackup = new Backup(windowsPath, mockConfig);
      const unixBackup = new Backup(unixPath, mockConfig);
      
      expect(windowsBackup.directory).toBe(windowsPath);
      expect(unixBackup.directory).toBe(unixPath);
    });
  });

  describe('execute', () => {
    it('should execute full database backup successfully', async () => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:00.000Z');
      
      // Mock successful mongodump execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      const promise = backup.execute();
      
      await promise;
      
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', [
        '--host', 'localhost:27017',
        '--db', 'fhir-test',
        '--username', 'testuser',
        '--password', 'testpass',
        '--authenticationDatabase', 'admin',
        '--out', expect.stringContaining('fhir-backup-')
      ], { stdio: ['inherit', 'pipe', 'pipe'] });
    });

    it('should handle mongodump execution failure', async () => {
      // Mock failed mongodump execution
      setTimeout(() => {
        mockChildProcess.stderr.emit('data', Buffer.from('Connection failed'));
        mockChildProcess.emit('close', 1);
      }, 10);
      
      await expect(backup.execute()).rejects.toThrow('mongodump exited with code 1');
    });

    it('should handle spawn error', async () => {
      // Mock spawn error
      setTimeout(() => {
        mockChildProcess.emit('error', new Error('Command not found'));
      }, 10);
      
      await expect(backup.execute()).rejects.toThrow('Failed to start mongodump: Command not found');
    });
  });

  describe('backupFhirResourcesCollection', () => {
    it('should backup FHIR resources collection successfully', async () => {
      // Mock directory doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      
      // Mock successful mongodump execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await backup.backupFhirResourcesCollection(mockConfig);
      
      // Should create directory
      expect(mockFs.mkdir).toHaveBeenCalledWith(testDirectory, { recursive: true });
      
      // Should call mongodump with collection parameter
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', expect.arrayContaining([
        '--collection', 'resources'
      ]), { stdio: ['inherit', 'pipe', 'pipe'] });
    });

    it('should handle existing directory', async () => {
      // Mock directory exists
      mockFs.access.mockResolvedValue(undefined);
      
      // Mock successful mongodump execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await backup.backupFhirResourcesCollection(mockConfig);
      
      // Should not create directory
      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });

    it('should handle config without authentication', async () => {
      const configNoAuth = {
        host: 'localhost',
        port: 27017,
        database: 'fhir-test'
      };
      
      const backupNoAuth = new Backup(testDirectory, configNoAuth);
      
      // Mock successful mongodump execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await backupNoAuth.backupFhirResourcesCollection(configNoAuth);
      
      const expectedArgs = [
        '--host', 'localhost:27017',
        '--db', 'fhir-test',
        '--collection', 'resources',
        '--out', expect.any(String)
      ];
      
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', expectedArgs, expect.any(Object));
    });
  });

  describe('buildMongodumpArgs', () => {
    it('should build basic mongodump arguments', () => {
      const args = (backup as any).buildMongodumpArgs('/test/output');
      
      expect(args).toEqual([
        '--host', 'localhost:27017',
        '--db', 'fhir-test',
        '--username', 'testuser',
        '--password', 'testpass',
        '--authenticationDatabase', 'admin',
        '--out', '/test/output'
      ]);
    });

    it('should build arguments without authentication', () => {
      const noAuthConfig = {
        host: 'localhost',
        port: 27017,
        database: 'fhir-test'
      };
      
      const backupNoAuth = new Backup(testDirectory, noAuthConfig);
      const args = (backupNoAuth as any).buildMongodumpArgs('/test/output');
      
      expect(args).toEqual([
        '--host', 'localhost:27017',
        '--db', 'fhir-test',
        '--out', '/test/output'
      ]);
    });

    it('should build arguments with collection', () => {
      const args = (backup as any).buildMongodumpArgs('/test/output', 'resources');
      
      expect(args).toContain('--collection');
      expect(args).toContain('resources');
    });

    it('should build arguments without output path', () => {
      const args = (backup as any).buildMongodumpArgs(null);
      
      expect(args).not.toContain('--out');
    });

    it('should handle empty username but with password', () => {
      const partialAuthConfig = {
        host: 'localhost',
        port: 27017,
        database: 'fhir-test',
        username: '',
        password: 'testpass'
      };
      
      const backupPartialAuth = new Backup(testDirectory, partialAuthConfig);
      const args = (backupPartialAuth as any).buildMongodumpArgs('/test/output');
      
      expect(args).not.toContain('--username');
      expect(args).not.toContain('--password');
      expect(args).not.toContain('--authenticationDatabase');
    });
  });

  describe('executeMongodump', () => {
    it('should execute mongodump successfully with stdout output', async () => {
      const testArgs = ['--host', 'localhost:27017'];
      
      // Mock successful execution with output
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', Buffer.from('Starting backup...'));
        mockChildProcess.stdout.emit('data', Buffer.from('Backup completed'));
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await (backup as any).executeMongodump(testArgs);
      
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', testArgs, {
        stdio: ['inherit', 'pipe', 'pipe']
      });
    });

    it('should reject on non-zero exit code', async () => {
      const testArgs = ['--host', 'invalid'];
      
      // Mock failed execution
      setTimeout(() => {
        mockChildProcess.stderr.emit('data', Buffer.from('Connection failed'));
        mockChildProcess.emit('close', 1);
      }, 10);
      
      await expect((backup as any).executeMongodump(testArgs)).rejects.toThrow(
        'mongodump exited with code 1. stderr: Connection failed'
      );
    });

    it('should reject on spawn error', async () => {
      const testArgs = ['--host', 'localhost:27017'];
      
      // Mock spawn error
      setTimeout(() => {
        mockChildProcess.emit('error', new Error('ENOENT: command not found'));
      }, 10);
      
      await expect((backup as any).executeMongodump(testArgs)).rejects.toThrow(
        'Failed to start mongodump: ENOENT: command not found'
      );
    });
  });

  describe('createBackupMetadata', () => {
    beforeEach(() => {
      // Mock current date
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:00.000Z');
    });

    it('should create metadata for full database backup', async () => {
      const backupPath = '/test/backup/path';
      
      await (backup as any).createBackupMetadata(backupPath, mockConfig);
      
      const expectedMetadata = {
        backupDate: '2024-01-15T10:30:00.000Z',
        backupType: 'database',
        collection: null,
        database: 'fhir-test',
        host: 'localhost',
        port: 27017,
        tool: 'mongodump',
        path: backupPath
      };
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/backup/path/fhir-test/backup_metadata.json',
        JSON.stringify(expectedMetadata, null, 2),
        'utf-8'
      );
    });

    it('should create metadata for collection backup', async () => {
      const backupPath = '/test/backup/path';
      const collection = 'resources';
      
      await (backup as any).createBackupMetadata(backupPath, mockConfig, collection);
      
      const expectedMetadata = {
        backupDate: '2024-01-15T10:30:00.000Z',
        backupType: 'collection',
        collection: 'resources',
        database: 'fhir-test',
        host: 'localhost',
        port: 27017,
        tool: 'mongodump',
        path: backupPath
      };
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/backup/path/backup_metadata.json',
        JSON.stringify(expectedMetadata, null, 2),
        'utf-8'
      );
    });

    it('should handle file write errors gracefully', async () => {
      const backupPath = '/test/backup/path';
      const writeError = new Error('Permission denied');
      
      mockFs.writeFile.mockRejectedValue(writeError);
      
      // Should not throw, but log error
      await (backup as any).createBackupMetadata(backupPath, mockConfig);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating backup metadata:', writeError);
    });

    it('should handle config with missing fields', async () => {
      const incompleteConfig = {
        database: 'test-db'
      };
      const backupPath = '/test/backup/path';
      
      await (backup as any).createBackupMetadata(backupPath, incompleteConfig);
      
      const expectedMetadata = {
        backupDate: '2024-01-15T10:30:00.000Z',
        backupType: 'database',
        collection: null,
        database: 'test-db',
        host: undefined,
        port: undefined,
        tool: 'mongodump',
        path: backupPath
      };
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(expectedMetadata, null, 2),
        'utf-8'
      );
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should not create directory if it already exists', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      await (backup as any).ensureDirectoryExists(testDirectory);
      
      expect(mockFs.access).toHaveBeenCalledWith(testDirectory);
      expect(mockFs.mkdir).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalledWith(`Created directory: ${testDirectory}`);
    });

    it('should create directory if it does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));
      
      await (backup as any).ensureDirectoryExists(testDirectory);
      
      expect(mockFs.access).toHaveBeenCalledWith(testDirectory);
      expect(mockFs.mkdir).toHaveBeenCalledWith(testDirectory, { recursive: true });
    });

    it('should handle mkdir errors', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));
      const mkdirError = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(mkdirError);
      
      await expect((backup as any).ensureDirectoryExists(testDirectory)).rejects.toThrow('Permission denied');
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(testDirectory, { recursive: true });
    });

    it('should handle different directory paths', async () => {
      const paths = [
        '/unix/style/path',
        'C:\\windows\\style\\path',
        './relative/path',
        '../parent/path'
      ];
      
      mockFs.access.mockRejectedValue(new Error('Not found'));
      
      for (const path of paths) {
        await (backup as any).ensureDirectoryExists(path);
        expect(mockFs.mkdir).toHaveBeenCalledWith(path, { recursive: true });
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete backup workflow', async () => {
      // Mock directory creation needed
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      
      // Mock successful mongodump
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', Buffer.from('Backup in progress...'));
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await backup.backupFhirResourcesCollection(mockConfig);
      
      // Verify complete workflow
      expect(mockFs.mkdir).toHaveBeenCalled(); // Directory created
      expect(mockSpawn).toHaveBeenCalled(); // Mongodump executed
      expect(mockFs.writeFile).toHaveBeenCalled(); // Metadata written
      expect(consoleLogSpy).toHaveBeenCalledWith('mongodump completed successfully');
    });

    it('should handle backup with authentication and collection', async () => {
      const authConfig = {
        host: 'prod-mongo.example.com',
        port: 27018,
        database: 'production-fhir',
        username: 'backup-user',
        password: 'secure-password'
      };
      
      const prodBackup = new Backup('/prod/backups', authConfig);
      
      // Mock successful execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await prodBackup.backupFhirResourcesCollection(authConfig);
      
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', expect.arrayContaining([
        '--host', 'prod-mongo.example.com:27018',
        '--db', 'production-fhir',
        '--username', 'backup-user',
        '--password', 'secure-password',
        '--authenticationDatabase', 'admin',
        '--collection', 'resources'
      ]), expect.any(Object));
    });

    it('should handle timestamp generation correctly', async () => {
      // Mock Date to return specific timestamp
      const originalDate = global.Date;
      const mockDate = {
        toISOString: jest.fn().mockReturnValue('2024-03-15T14:25:30.123Z')
      };
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;
      
      // Mock successful execution
      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);
      
      await backup.execute();
      
      // Verify timestamp formatting in path
      expect(mockSpawn).toHaveBeenCalledWith('mongodump', expect.arrayContaining([
        '--out', expect.stringContaining('fhir-backup-2024-03-15T14-25-30-123Z')
      ]), expect.any(Object));
      
      // Restore original Date
      global.Date = originalDate;
    });
  });
});