import * as mongoose from 'mongoose';
import * as fs from 'node:fs';
import { Model } from 'mongoose';
import { FhirResource, fhirResourceSchema } from '../src/schema/fhir-resource-schema';
import * as path from 'node:path';
import { createReadStream } from 'fs';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Loads configuration from the appropriate environment file
 * @returns {object} The configuration settings
 */
const loadConfiguration = (): any => {

    const env = process.env.ENV_NAME || 'dev'
    const configFilePath = resolve(__dirname, `../../config/${env}.json`)

    if (existsSync(configFilePath)) {
        const config = readFileSync(configFilePath, 'utf8').toString()
        return JSON.parse(config)
    } else {
        throw new Error(`Config file ${configFilePath} not found`)
    }
}

/**
 * Generates a MongoDB connection string based on the provided configuration object.
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
 * Extracts a ZIP file to a temporary directory
 * @param {string} zipPath - Path to the ZIP file
 * @param {string} extractPath - Directory to extract to
 */
const extractZip = async (zipPath: string, extractPath: string): Promise<void> => {

    const unzipper = await import('unzipper')

    return new Promise((resolve, reject) => {
        createReadStream(zipPath)
            .pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const fileName = entry.path
                const type = entry.type
                
                if (type === 'File') {
                    const fullPath = path.join(extractPath, fileName)
                    const dir = path.dirname(fullPath)
                    
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true })
                    }
                    
                    entry.pipe(fs.createWriteStream(fullPath))
                } else {
                    entry.autodrain()
                }
            })
            .on('close', resolve)
            .on('error', reject)
    })
}

/**
 * Main function that handles the import process:
 * 1. Connects to MongoDB using configuration
 * 2. Initializes the FHIR resource model
 * 3. Processes ZIP files or directories
 * 4. Imports all FHIR resources found
 * 5. Closes database connection when complete
 */
const main = async (): Promise<void> => {
  
  await mongoose.connect(getConnectionString(), {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 120000,
    bufferCommands: false
  });
  
  try {
    
    const model: Model<any> = mongoose.model(FhirResource.name, fhirResourceSchema, 'resources');
    const exportDir = path.join(__dirname, '..', '..', 'export');
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const startTime = Date.now();
    
    /**
     * Recursively processes a directory to find and import JSON files
     * @param dirPath - The path to the directory to process
     */
    const processDirectory = async (dirPath: string): Promise<void> => {
      
      if (!fs.existsSync(dirPath)) {
        console.log(`Directory does not exist: ${dirPath}`);
        return;
      }
      
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        
        const fullPath = path.join(dirPath, entry);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          
          await processDirectory(fullPath);
          
        } else if (stats.isFile() && entry.endsWith('.json')) {
          
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const resource = JSON.parse(content);
            
            // Ensure the resource has the required structure
            if (resource.resourceType && resource.id) {
              try {
                await model.create(resource);
                importedCount++;
                
                if (importedCount % 100 === 0) {
                  console.log(`Imported ${importedCount} resources...`);
                }
              } catch (duplicateError: any) {
                if (duplicateError.code === 11000) {
                  // Duplicate key error - skip with warning
                  duplicateCount++;

                  if (duplicateCount % 50 === 0) {
                    console.log(`Skipped ${duplicateCount} duplicate resources...`);
                  }
                } else {
                  throw duplicateError; // Re-throw other errors
                }
              }
            } else {
              console.log(`Skipping invalid resource in: ${fullPath}`);
            }
            
          } catch (error) {
            console.error(`Failed to import ${fullPath}:`, error);
            errorCount++;
          }
        }
      }
    };
    
    // Check if export directory exists
    if (!fs.existsSync(exportDir)) {
      console.log(`Export directory does not exist: ${exportDir}`);
      console.log('Please run the export script first or check the directory path.');
      return;
    }
    
    // Find ZIP files in export directory
    const entries = fs.readdirSync(exportDir);
    const zipFiles = entries.filter(entry => entry.endsWith('.zip'));
    
    if (zipFiles.length > 0) {
      console.log(`Found ${zipFiles.length} ZIP file(s) to process`);
      
      for (const zipFile of zipFiles) {
        const zipPath = path.join(exportDir, zipFile);
        const tempDir = path.join(exportDir, 'temp_import');
        
        console.log(`\nProcessing ZIP file: ${zipFile}`);
        
        try {

          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }

          fs.mkdirSync(tempDir, { recursive: true });
          
          // Extract ZIP file
          console.log('Extracting ZIP file...');
          await extractZip(zipPath, tempDir);
          
          // Process extracted files
          console.log('Importing resources...');
          await processDirectory(tempDir);
          
          // Clean up temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          
        } catch (error) {
          console.error(`Failed to process ZIP file ${zipFile}:`, error);
        }
      }
    } else {
      // No ZIP files found, try to process directory structure
      console.log('No ZIP files found, processing directory structure...');
      await processDirectory(exportDir);
    }
    
    const totalTime = Date.now() - startTime;
    const minutes = Math.round(totalTime / (60 * 1000));
    
    console.log(`\n========== IMPORT COMPLETED ==========`);
    console.log(`Total resources imported: ${importedCount.toLocaleString()}`);
    console.log(`Duplicate resources skipped: ${duplicateCount.toLocaleString()}`);
    console.log(`Errors encountered: ${errorCount.toLocaleString()}`);
    console.log(`Total time: ${minutes} minutes`);

    if (importedCount > 0) {
      console.log(`Average rate: ${(importedCount / (totalTime / 1000)).toFixed(1)} resources/second`);
    }

    console.log(`=====================================`);
    
  } catch (error: any) {
    console.log(error)
  } finally {
    mongoose.disconnect()
  }
}

main().catch(err => console.log(err));
