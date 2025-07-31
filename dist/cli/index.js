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
        const entities = await model.find({});
        if (Array.isArray(entities)) {
            for (const entity of entities) {
                const filename = `${entity.resource.id}.json`;
                if (!fs.existsSync(`${directory}/${entity.resourceType}`)) {
                    fs.mkdirSync(`${directory}/${entity.resourceType}`, { recursive: true });
                }
                fs.writeFileSync(path.join(`${directory}/${entity.resourceType}`, filename), JSON.stringify(entity.resource, null, 2));
                console.log(filename);
            }
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        mongoose.disconnect();
    }
};
main().catch(err => console.log(err));
//# sourceMappingURL=index.js.map