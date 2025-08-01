"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const fs = require("node:fs");
const fhir_resource_schema_1 = require("../src/schema/fhir-resource-schema");
const path = require("node:path");
const main = async () => {
    await mongoose.connect('mongodb://localhost:27017/fhir-server');
    try {
        const model = mongoose.model(fhir_resource_schema_1.FhirResource.name, fhir_resource_schema_1.fhirResourceSchema, 'resources');
        const directory = path.join(__dirname, '..', '..', 'export');
        const processDirectory = async (dirPath) => {
            const entries = fs.readdirSync(dirPath);
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    await processDirectory(fullPath);
                }
                else if (stats.isFile() && entry.endsWith('.json')) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const resource = JSON.parse(content);
                    await model.create({
                        id: resource.id,
                        resourceType: resource.resourceType,
                        resource: resource,
                        createdAt: new Date(),
                        tags: ['imported']
                    });
                    console.log(`Imported: ${fullPath}`);
                }
            }
        };
        await processDirectory(directory);
    }
    catch (error) {
        console.log(error);
    }
    finally {
        mongoose.disconnect();
    }
};
main().catch(err => console.log(err));
//# sourceMappingURL=import.js.map