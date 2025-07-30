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
exports.FhirController = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_1 = require("../services/fhir/fhir.service");
const swagger_1 = require("@nestjs/swagger");
const validation_service_1 = require("../services/validation/validation.service");
const authorizer_guard_1 = require("../guards/authorizer/authorizer.guard");
let FhirController = class FhirController {
    _service;
    _validatiobService;
    constructor(_service, _validatiobService) {
        this._service = _service;
        this._validatiobService = _validatiobService;
    }
    getCapabilityStatement() {
        return this._service.getMetaData();
    }
    async validate(resource) {
        return await this._validatiobService.validateResource(resource);
    }
    async searchResources(resourceType, searchParams) {
        return await this._service.find(resourceType, searchParams);
    }
    async getResource(resourceType, id) {
        return await this._service.findById(resourceType, id);
    }
    async createResource(resourceType, resource) {
        await this._service.checkPreRequest('POST', resourceType, resource);
        return await this._service.create(resourceType, resource);
    }
    async update(resourceType, id, resource) {
        await this._service.checkPreRequest('POST', resourceType, resource, id);
        return await this._service.update(resourceType, id, resource);
    }
    delete(resourceType, id) {
        return this._service.delete(resourceType, id);
    }
};
exports.FhirController = FhirController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get FHIR server capability statement', description: 'Returns the FHIR server metadata including supported resources and operations' }),
    (0, common_1.Get)('metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], FhirController.prototype, "getCapabilityStatement", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Validate FHIR resource', description: 'Validates a FHIR resource against its structure definition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource validation result' }),
    (0, common_1.Post)('$validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "validate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Search FHIR resources', description: 'Search for FHIR resources of specific type with optional search parameters' }),
    (0, swagger_1.ApiParam)({ name: 'resourceType', description: 'Type of FHIR resource' }),
    (0, common_1.Get)(':resourceType'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "searchResources", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get FHIR resource by ID', description: 'Retrieve a specific FHIR resource by its type and ID' }),
    (0, swagger_1.ApiParam)({ name: 'resourceType', description: 'Type of FHIR resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, common_1.Get)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "getResource", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create FHIR resource', description: 'Create a new FHIR resource' }),
    (0, swagger_1.ApiParam)({ name: 'resourceType', description: 'Type of FHIR resource' }),
    (0, common_1.Post)(':resourceType'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "createResource", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update FHIR resource', description: 'Update an existing FHIR resource by its ID' }),
    (0, swagger_1.ApiParam)({ name: 'resourceType', description: 'Type of FHIR resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, common_1.Put)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete FHIR resource', description: 'Delete a FHIR resource by its ID' }),
    (0, swagger_1.ApiParam)({ name: 'resourceType', description: 'Type of FHIR resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, common_1.Delete)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "delete", null);
exports.FhirController = FhirController = __decorate([
    (0, common_1.UseGuards)(authorizer_guard_1.AuthorizerGuard),
    (0, swagger_1.ApiTags)('Fhir Server'),
    (0, common_1.Controller)('fhir'),
    __metadata("design:paramtypes", [fhir_service_1.FhirService, validation_service_1.ValidationService])
], FhirController);
//# sourceMappingURL=fhir.controller.js.map