"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FhirService = void 0;
const common_1 = require("@nestjs/common");
const fhir_resource_schema_1 = require("../../schema/fhir-resource-schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const fhir_response_1 = require("../../lib/fhir-response");
const delete_operation_1 = require("../../lib/operations/delete-operation");
const create_operation_1 = require("../../lib/operations/create-operation");
const update_operation_1 = require("../../lib/operations/update-operation");
const search_operation_1 = require("../../lib/operations/search-operation");
const validation_service_1 = require("../validation/validation.service");
const structure_definition_schema_1 = require("../../schema/structure-definition.schema");
const metadata_1 = require("../../lib/metadata");
let FhirService = class FhirService {
    fhirResourceModel;
    structureDefinitonModel;
    validationService;
    constructor(fhirResourceModel, structureDefinitonModel, validationService) {
        this.fhirResourceModel = fhirResourceModel;
        this.structureDefinitonModel = structureDefinitonModel;
        this.validationService = validationService;
    }
    async findById(resourceType, id) {
        try {
            const operation = new search_operation_1.SearchOperation(this.fhirResourceModel);
            return await operation.findById(resourceType, id);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Error retrieving ${resourceType}/${id}: ${error.message}`);
        }
    }
    async find(resourceType, searchParams) {
        try {
            const operation = new search_operation_1.SearchOperation(this.fhirResourceModel);
            return operation.find(resourceType, searchParams);
        }
        catch (error) {
            throw new Error(`Error searching ${resourceType}: ${error.message}`);
        }
    }
    async create(resourceType, resourceData) {
        await this.validationService.validateResource(resourceData);
        try {
            const operation = new create_operation_1.CreateOperation(this.fhirResourceModel);
            return operation.execute(resourceType, resourceData);
        }
        catch (error) {
            if (error instanceof common_1.NotAcceptableException) {
                return fhir_response_1.FhirResponse.notAcceptatble(error.message);
            }
            throw new Error(`Error creating ${resourceType}: ${error.message}`);
        }
    }
    async update(resourceType, id, resourceData) {
        await this.validationService.validateResource(resourceData);
        try {
            const operation = new update_operation_1.UpdateOperation(this.fhirResourceModel);
            return operation.execute(resourceType, id, resourceData);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new Error(`Error updating ${resourceType}/${id}: ${error.message}`);
        }
    }
    async delete(resourceType, id) {
        try {
            const operation = new delete_operation_1.DeleteOperation(this.fhirResourceModel);
            return operation.execute(resourceType, id);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return fhir_response_1.FhirResponse.notFound(error.message);
            }
            throw new Error(`Error deleting ${resourceType}/${id}: ${error.message}`);
        }
    }
    async getMetaData() {
        const structures = await this.structureDefinitonModel.distinct('resourceType').exec();
        return (new metadata_1.Metadata()).get(structures);
    }
    async checkPreRequest(method, resourceType, data, id) {
        if (method === 'POST') {
            if (data?.resourceType !== resourceType) {
                throw new common_1.BadRequestException(`ResourceType (${resourceType}) in the URL does not match the ResourceType in the request body (${data.resourceType})`);
            }
        }
        else if (method === 'PUT') {
            if (!id) {
                throw new common_1.BadRequestException('ID is required for PUT operation');
            }
            if (data?.id !== id) {
                throw new common_1.BadRequestException(`ID in the URL (${id}) does not match the ID in the request body. (${data.id}`);
            }
            if (data?.resourceType !== resourceType) {
                throw new common_1.BadRequestException(`ResourceType (${resourceType}) in the URL does not match the ResourceType in the request body (${data.resourceType})`);
            }
        }
        else {
            throw new common_1.BadRequestException(`Unsupported HTTP method: ${method}`);
        }
    }
};
exports.FhirService = FhirService;
exports.FhirService = FhirService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(fhir_resource_schema_1.FhirResource.name)),
    __param(1, (0, mongoose_2.InjectModel)(structure_definition_schema_1.StructureDefinitionSchema.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        validation_service_1.ValidationService])
], FhirService);
//# sourceMappingURL=fhir.service.js.map