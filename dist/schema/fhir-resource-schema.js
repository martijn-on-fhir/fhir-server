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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fhirResourceSchema = exports.FhirResource = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let FhirResource = class FhirResource {
    resourceType;
    id;
    meta;
    resource;
    status;
    tags;
    searchParams;
};
exports.FhirResource = FhirResource;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], FhirResource.prototype, "resourceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true
    }),
    __metadata("design:type", String)
], FhirResource.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Object,
        default: () => ({
            versionId: '1',
            lastUpdated: new Date(),
            profile: []
        })
    }),
    __metadata("design:type", Object)
], FhirResource.prototype, "meta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], FhirResource.prototype, "resource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active', index: true }),
    __metadata("design:type", String)
], FhirResource.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FhirResource.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], FhirResource.prototype, "searchParams", void 0);
exports.FhirResource = FhirResource = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'resources',
        timestamps: { createdAt: 'meta.lastUpdated', updatedAt: false },
        strict: false,
        versionKey: false
    })
], FhirResource);
exports.fhirResourceSchema = mongoose_1.SchemaFactory.createForClass(FhirResource);
exports.fhirResourceSchema.index({ resourceType: 1, id: 1 });
exports.fhirResourceSchema.index({ resourceType: 1, status: 1 });
exports.fhirResourceSchema.index({ 'meta.lastUpdated': -1 });
//# sourceMappingURL=fhir-resource-schema.js.map