"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const fhir_controller_1 = require("./fhir/fhir.controller");
const fhir_service_1 = require("./services/fhir/fhir.service");
const mongoose_1 = require("@nestjs/mongoose");
const fhir_resource_schema_1 = require("./schema/fhir-resource-schema");
const structure_definition_schema_1 = require("./schema/structure-definition.schema");
const validation_service_1 = require("./services/validation/validation.service");
const throttler_1 = require("@nestjs/throttler");
const config_1 = require("@nestjs/config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: 10,
                    },
                ],
            }),
            config_1.ConfigModule.forRoot(),
            mongoose_1.MongooseModule.forRoot("mongodb://localhost:27017/fhir-server", {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: fhir_resource_schema_1.FhirResource.name, schema: fhir_resource_schema_1.fhirResourceSchema },
                { name: structure_definition_schema_1.StructureDefinitionSchema.name, schema: structure_definition_schema_1.structureDefinitionSchema }
            ]),
        ],
        controllers: [app_controller_1.AppController, fhir_controller_1.FhirController],
        providers: [app_service_1.AppService, fhir_service_1.FhirService, validation_service_1.ValidationService],
        exports: [mongoose_1.MongooseModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map