import {spawn, ChildProcess} from 'child_process';
import {promises as fs} from 'fs';
import {join} from 'path';

export class Backup {

    /**
     * Directory where backups will be stored
     * @type {string}
     */
    directory: string

    /**
     * Database configuration object
     * @type {any}
     */
    config

    /**
     * Constructor for Backup class
     * @param directory
     * @param config
     */
    constructor(directory: string, config: any) {
        this.directory = directory
        this.config = config
    }

    /**
     * Executes the backup process
     * @returns Promise that resolves when backup is complete
     */
    async execute(): Promise<void> {

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = join(this.directory, `fhir-backup-${timestamp}`)
        const args = this.buildMongodumpArgs(backupPath)

        await this.executeMongodump(args)
        await this.createBackupMetadata(backupPath, this.config)
    }

    /**
     * Back up alleen de FHIR resources collection
     * @param config - Database configuration object
     * @returns Promise that resolves when backup is complete
     */
    async backupFhirResourcesCollection(config: {
        host: string;
        port: number;
        database: string;
        username?: string;
        password?: string;
    }): Promise<void> {

        await this.ensureDirectoryExists(this.directory)

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = join(this.directory, `fhir-resources-${timestamp}`)
        const args = this.buildMongodumpArgs(backupPath, 'resources')

        await this.executeMongodump(args);
        await this.createBackupMetadata(backupPath, config, 'resources')
    }

    /**
     * Bouw mongodump command argumenten
     * @param config - Database configuratie
     * @param outputPath - Output pad (kan null zijn voor archive)
     * @param collection - Specifieke collectie (optioneel)
     * @returns Array van command argumenten
     */
    private buildMongodumpArgs(outputPath?: string | null, collection?: string): string[] {

        const args: string[] = []

        args.push('--host', `${this.config.host}:${this.config.port}`)
        args.push('--db', this.config.database)

        // Authenticatie indien aanwezig
        if (this.config.username && this.config.password) {

            args.push('--username', this.config.username)
            args.push('--password', this.config.password)
            args.push('--authenticationDatabase', 'admin')
        }

        if (collection) {
            args.push('--collection', collection)
        }

        if (outputPath) {
            args.push('--out', outputPath)
        }

        return args
    }

    /**
     * Voer mongodump command uit
     * @param args - Command argumenten
     * @returns Promise dat resolved wanneer command klaar is
     */
    private executeMongodump(args: string[]): Promise<void> {

        return new Promise((resolve, reject) => {

            const mongodump: ChildProcess = spawn('mongodump', args, {
                stdio: ['inherit', 'pipe', 'pipe']
            })

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let stdout = ''
            let stderr = ''

            mongodump.stdout?.on('data', (data) => {
                const output = data.toString()
                stdout += output
            })

            mongodump.stderr?.on('data', (data) => {
                const output = data.toString()
                stderr += output
            })

            mongodump.on('close', (code) => {
                if (code === 0) {
                    console.log('mongodump completed successfully');
                    resolve()
                } else {
                    reject(new Error(`mongodump exited with code ${code}. stderr: ${stderr}`))
                }
            })

            mongodump.on('error', (error) => {
                reject(new Error(`Failed to start mongodump: ${error.message}`))
            })
        });
    }

    /**
     * Maak metadata bestand voor de backup
     * @param backupPath - Pad naar backup
     * @param config - Database configuratie
     * @param collection - Collectie naam (optioneel)
     */
    private async createBackupMetadata(backupPath: string, config: any, collection?: string): Promise<void> {
        try {

            const metadata = {
                backupDate: new Date().toISOString(),
                backupType: collection ? 'collection' : 'database',
                collection: collection || null,
                database: config.database,
                host: config.host,
                port: config.port,
                tool: 'mongodump',
                path: backupPath
            }

            const metadataPath = collection
                ? join(backupPath, 'backup_metadata.json')
                : join(backupPath, config.database, 'backup_metadata.json')

            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

        } catch (error) {
            console.error('Error creating backup metadata:', error)
        }
    }

    /**
     * Ensure directory exists, create if it doesn't
     * @param dirPath - Path to directory
     */
    private async ensureDirectoryExists(dirPath: string): Promise<void> {

        try {
            await fs.access(dirPath)
        } catch {
            await fs.mkdir(dirPath, {recursive: true})
        }
    }
}