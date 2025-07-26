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
let FhirController = class FhirController {
    _service;
    constructor(_service) {
        this._service = _service;
    }
    getCapabilityStatement() {
        return this._service.getMetaData();
    }
    async searchResources(resourceType, searchParams) {
        return this._service.find(resourceType, searchParams);
    }
    async getResource(resourceType, id) {
        return this._service.findById(resourceType, id);
    }
    async createResource(resourceType, resource) {
        await this._service.checkPreRequest('POST', resourceType, resource);
        return this._service.create(resourceType, resource);
    }
    async update(resourceType, id, resource) {
        await this._service.checkPreRequest('POST', resourceType, resource, id);
        return this._service.update(resourceType, id, resource);
    }
    delete(resourceType, id) {
        return this._service.delete(resourceType, id);
    }
};
exports.FhirController = FhirController;
__decorate([
    (0, common_1.Get)('metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], FhirController.prototype, "getCapabilityStatement", null);
__decorate([
    (0, common_1.Get)(':resourceType'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "searchResources", null);
__decorate([
    (0, common_1.Get)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "getResource", null);
__decorate([
    (0, common_1.Post)(':resourceType'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "createResource", null);
__decorate([
    (0, common_1.Put)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':resourceType/:id'),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FhirController.prototype, "delete", null);
exports.FhirController = FhirController = __decorate([
    (0, swagger_1.ApiTags)('Fhir Server'),
    (0, common_1.Controller)('fhir'),
    __metadata("design:paramtypes", [fhir_service_1.FhirService])
], FhirController);
//# sourceMappingURL=fhir.controller.js.map