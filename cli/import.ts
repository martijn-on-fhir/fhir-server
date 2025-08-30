/**
 * CLI script for importing FHIR resources from JSON files into MongoDB.
 * Recursively processes directories to find and import JSON files containing
 * FHIR resources, maintaining the original resource data while adding
 * metadata like UUID and timestamps.
 */

import * as mongoose from 'mongoose';
import * as fs from 'node:fs';
import { Model } from 'mongoose';
import { FhirResource, fhirResourceSchema } from '../src/schema/fhir-resource-schema';
import * as path from 'node:path';

/**
 * Main function that handles the import process:
 * 1. Connects to MongoDB
 * 2. Initializes the FHIR resource model
 * 3. Processes the export directory recursively
 * 4. Closes database connection when complete
 */
const main = async (): Promise<void> => {
  
  await mongoose.connect('mongodb://localhost:27017/fhir-server');
  
  try {
    
    const model: Model<any> = mongoose.model(FhirResource.name, fhirResourceSchema, 'resources');
    const directory = path.join(__dirname, '..', '..', 'export');
    
    /**
     * Recursively processes a directory to find and import JSON files
     * @param dirPath - The path to the directory to process
     */
    const processDirectory = async (dirPath: string): Promise<void> => {
      
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        
        const fullPath = path.join(dirPath, entry);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          
          await processDirectory(fullPath);
          
        } else if (stats.isFile() && entry.endsWith('.json')) {
          
          const content = fs.readFileSync(fullPath, 'utf8');
          const resource = JSON.parse(content);
          
          await model.create({
            ...resource
          });
          
          console.log(`Imported: ${fullPath}`);
        }
      }
    };
    
    await processDirectory(directory);
    
  } catch (error: any) {
    console.log(error)
  } finally {
    mongoose.disconnect()
  }
}

main().catch(err => console.log(err));
