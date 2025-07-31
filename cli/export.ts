/**
 * CLI script for exporting FHIR resources from MongoDB to JSON files.
 * Each resource is exported to a separate file within a directory structure
 * organized by resource type.
 */

import * as mongoose from 'mongoose';
import * as fs from 'node:fs';
import { Model } from 'mongoose';
import { FhirResource, fhirResourceSchema } from '../src/schema/fhir-resource-schema';
import * as path from 'node:path';

/**
 * Main function that handles the export process:
 * 1. Connects to MongoDB
 * 2. Retrieves all FHIR resources
 * 3. Creates directory structure by resource type
 * 4. Exports each resource as a JSON file
 * 5. Closes database connection
 */
const main = async (): Promise<void> => {
  
  await mongoose.connect('mongodb://localhost:27017/fhir-server');
  
  try {
    
    // Initialize MongoDB model for FHIR resources
    const model: Model<any> = mongoose.model(FhirResource.name, fhirResourceSchema, 'resources');
    // Set up export directory path
    const directory = path.join(__dirname, '..', '..', 'export');
    
    // Retrieve all FHIR resources from database
    const entities = await model.find({

    });
    
    if(Array.isArray(entities)){
      
      for(const entity of entities){
        
        const filename = `${entity.resource.id}.json`
        
        // Create resource type directory if it doesn't exist
        if (!fs.existsSync(`${directory}/${entity.resourceType}`)) {
          fs.mkdirSync(`${directory}/${entity.resourceType}`, { recursive: true });
        }
        
        // Write resource to JSON file with pretty printing
        fs.writeFileSync(
          path.join(`${directory}/${entity.resourceType}`, filename),
          JSON.stringify(entity.resource, null, 2),
        );
        
        console.log(filename)
      }
    }

  } catch (e: any) {
    console.log(e)
  } finally {
    mongoose.disconnect();
  }
}

main().catch(err => console.log(err));
