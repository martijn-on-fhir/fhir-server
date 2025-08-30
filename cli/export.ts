import * as mongoose from 'mongoose'
import * as fs from 'node:fs'
import {Model} from 'mongoose'
import {FhirResource, fhirResourceSchema} from '../src/schema/fhir-resource-schema'
import * as path from 'node:path'
import * as archiver from 'archiver'
import {existsSync, readFileSync} from 'fs'
import {resolve} from 'path'

/**
 * Loads configuration from the appropriate environment file
 * @returns {object} The configuration settings
 */
const loadConfiguration = (): any => {

    const env = process.env.ENV_NAME || 'dev'
    const configFilePath = resolve(__dirname, `../config/${env}.json`)

    if (existsSync(configFilePath)) {
        const config = readFileSync(configFilePath, 'utf8').toString()
        return JSON.parse(config)
    } else {
        throw new Error(`Config file ${configFilePath} not found`)
    }
}

/**
 * Generates a MongoDB connection string based on the provided configuration object.
 *
 * The function retrieves the database connection configuration and constructs
 * a MongoDB connection URI. If the configuration specifies both a username and
 * a password, an authenticated connection string is returned. Otherwise, an
 * unauthenticated connection string is returned.
 *
 * @returns {string} The MongoDB connection URI.
 */
const getConnectionString = (): string => {

    const config: any = loadConfiguration()

    if (config.mongodb.username && config.mongodb.password) {
        return `mongodb://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}?authSource=admin`
    } else {
        return `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`
    }
}

/**
 * Creates a ZIP archive from the temp directory and stores it in the backup directory.
 * @param {string} tempDir - The temporary directory containing the exported JSON files
 * @param {string} backupDir - The backup directory where the ZIP file will be stored
 * @returns {Promise<string>} - The path to the created ZIP file
 */
const createZipArchive = async (tempDir: string, backupDir: string): Promise<string> => {

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const zipPath = path.join(backupDir, `fhir-export-${timestamp}.zip`)

    return new Promise((resolve, reject) => {

        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', {
            zlib: {level: 6}, // Balanced compression (faster than level 9, good compression)
            forceLocalTime: true,
            store: false // Always compress
        })

        output.on('close', () => {
            const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2)
            console.log(`\nZIP archive created: ${zipPath} (${sizeMB} MB)`)
            resolve(zipPath)
        })

        archive.on('error', (err) => {
            reject(err)
        })

        // Progress reporting for ZIP creation
        archive.on('progress', (progress) => {

            const sizeMB = (progress.fs.processedBytes / (1024 * 1024)).toFixed(2)
            const totalMB = (progress.fs.totalBytes / (1024 * 1024)).toFixed(2)
            const percent = ((progress.fs.processedBytes / progress.fs.totalBytes) * 100).toFixed(1)

            console.log(`ZIP Progress: ${sizeMB}/${totalMB} MB (${percent}%) - ${progress.entries.processed}/${progress.entries.total} files`)
        })

        archive.pipe(output)
        archive.directory(tempDir, false)
        archive.finalize()
    })
}

/**
 * Recursively removes a directory and all its contents.
 * @param {string} dir - The directory to remove
 */
const removeDirectory = (dir: string): void => {

    if (fs.existsSync(dir)) {
        fs.rmSync(dir, {recursive: true, force: true})
        console.log(`Removed export directory: ${dir}`)
    }
}

/**
 * Main function that handles the export process:
 * 1. Connects to MongoDB using configuration
 * 2. Retrieves all FHIR resources
 * 3. Creates directory structure by resource type
 * 4. Exports each resource as a JSON file
 * 5. Creates ZIP archive of all exported files
 * 6. Removes original JSON files and directory
 * 7. Closes database connection
 */
const main = async (): Promise<void> => {

    if (process.env.NODE_ENV !== 'development') {
        console.log('For optimal performance with 1M+ records, run with: node --max-old-space-size=8192 --expose-gc')
    }

    await mongoose.connect(getConnectionString(), {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 120000,
        bufferCommands: false
    })

    try {

        const model: Model<any> = mongoose.model(FhirResource.name, fhirResourceSchema, 'resources')
        const backupDir = path.join(__dirname, '..', 'export')
        const tempDir = path.join(backupDir, 'temp')
        const totalCount = await model.countDocuments({})

        console.log(`Found ${totalCount} FHIR resources to export`)

        if (totalCount > 0) {

            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, {recursive: true})
            }

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, {recursive: true})
            }

            const batchSize = totalCount > 100000 ? 2000 : 1000
            let processedCount = 0
            const startTime = Date.now()

            console.log(`Processing ${totalCount} records in batches of ${batchSize}...`)

            for (let skip = 0; skip < totalCount; skip += batchSize) {

                const currentBatchSize = Math.min(batchSize, totalCount - skip)

                console.log(`\nProcessing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalCount / batchSize)} (records ${skip + 1}-${skip + currentBatchSize})`)

                const entities = await model.find({})
                    .skip(skip)
                    .limit(batchSize)
                    .lean() // Use lean() for better performance and lower memory usage

                for (const entity of entities) {

                    try {
                        // Handle different possible resource structures
                        const resource = entity.resource || entity
                        const resourceType = entity.resourceType || resource.resourceType || 'Unknown'
                        const resourceId = resource.id || 'no-id'

                        // Skip if no valid resourceType found
                        if (!resourceType || resourceType === 'Unknown') {
                            console.log(`Skipping entity with missing resourceType: ${JSON.stringify(entity)}`)
                            continue
                        }

                        const filename = `${resourceId}.json`
                        const resourceTypeDir = path.join(tempDir, resourceType)

                        if (!fs.existsSync(resourceTypeDir)) {
                            fs.mkdirSync(resourceTypeDir, {recursive: true})
                        }

                        fs.writeFileSync(
                            path.join(resourceTypeDir, filename),
                            JSON.stringify(resource), // No pretty printing for performance
                        )

                        processedCount++

                        if (processedCount % 100 === 0) {

                            const elapsed = Date.now() - startTime
                            const rate = processedCount / (elapsed / 1000)
                            const eta = (totalCount - processedCount) / rate
                            const etaMinutes = Math.round(eta / 60)

                            console.log(`Progress: ${processedCount}/${totalCount} (${(processedCount / totalCount * 100).toFixed(1)}%) - ${rate.toFixed(1)} records/sec - ETA: ${etaMinutes}min`)
                        }

                    } catch (error) {
                        console.error(`Failed to export entity: ${error}`)
                        console.error(`Entity data: ${JSON.stringify(entity)}`)
                    }
                }

                // Memory cleanup after each batch
                if (global.gc) {
                    global.gc()
                }
            }

            console.log(`\nCreating ZIP archive...`)

            const zipPath = await createZipArchive(tempDir, backupDir)
            removeDirectory(tempDir)

            const totalElapsed = Date.now() - startTime
            const totalMinutes = Math.round(totalElapsed / (60 * 1000))
            const avgRate = processedCount / (totalElapsed / 1000)

            console.log(`\n========== EXPORT COMPLETED ==========`)
            console.log(`Total records exported: ${processedCount.toLocaleString()}`)
            console.log(`Total time: ${totalMinutes} minutes`)
            console.log(`Average rate: ${avgRate.toFixed(1)} records/second`)
            console.log(`ZIP file location: ${zipPath}`)

            const stats = fs.statSync(zipPath)
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)

            console.log(`Final ZIP size: ${fileSizeMB} MB`)
            console.log(`=====================================`)

        } else {
            console.log('No FHIR resources found to export')
        }

    } catch (e: any) {
        console.error('Export failed:', e)
    } finally {
        mongoose.disconnect()
    }
}

main().catch(err => console.log(err))
