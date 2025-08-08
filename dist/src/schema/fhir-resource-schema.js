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
const uuid_1 = require("uuid");
let FhirResource = class FhirResource {
    id;
    resourceType;
    meta;
    implicitRules;
    language;
    text;
    contained;
    extension;
    modifierExtension;
    identifier;
    tags;
};
exports.FhirResource = FhirResource;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        index: true
    }),
    __metadata("design:type", String)
], FhirResource.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], FhirResource.prototype, "resourceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            versionId: String,
            lastUpdated: { type: Date, default: Date.now },
            profile: [String],
            security: [Object],
            tag: [Object],
            source: String
        }
    }),
    __metadata("design:type", Object)
], FhirResource.prototype, "meta", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FhirResource.prototype, "implicitRules", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FhirResource.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], FhirResource.prototype, "text", void 0);
__decorate([
    (0, mongoose_1.Prop)([Object]),
    __metadata("design:type", Array)
], FhirResource.prototype, "contained", void 0);
__decorate([
    (0, mongoose_1.Prop)([Object]),
    __metadata("design:type", Array)
], FhirResource.prototype, "extension", void 0);
__decorate([
    (0, mongoose_1.Prop)([Object]),
    __metadata("design:type", Array)
], FhirResource.prototype, "modifierExtension", void 0);
__decorate([
    (0, mongoose_1.Prop)([Object]),
    __metadata("design:type", Array)
], FhirResource.prototype, "identifier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FhirResource.prototype, "tags", void 0);
exports.FhirResource = FhirResource = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'resources',
        timestamps: { createdAt: false, updatedAt: false },
        strict: false,
        versionKey: false,
        discriminatorKey: 'resourceType'
    })
], FhirResource);
exports.fhirResourceSchema = mongoose_1.SchemaFactory.createForClass(FhirResource);
exports.fhirResourceSchema.index({ resourceType: 1, id: 1 }, { unique: true });
exports.fhirResourceSchema.index({ 'meta.lastUpdated': 1 });
exports.fhirResourceSchema.index({ 'meta.profile': 1 });
exports.fhirResourceSchema.index({ 'identifier.system': 1, 'identifier.value': 1 });
exports.fhirResourceSchema.index({ tags: 1 });
exports.fhirResourceSchema.index({ resourceType: 1, status: 1 });
exports.fhirResourceSchema.index({ resourceType: 1, 'subject.reference': 1 });
exports.fhirResourceSchema.index({ resourceType: 1, 'patient.reference': 1 });
exports.fhirResourceSchema.pre('save', function (next) {
    if (!this.id) {
        this.id = (0, uuid_1.v4)();
    }
    this.meta = this.meta || {};
    this.meta.lastUpdated = new Date();
    if (!this.meta.versionId) {
        this.meta.versionId = '1';
    }
    else if (this.isModified() && !this.isNew) {
        const current = Number(this.meta.versionId);
        this.meta.versionId = String(isNaN(current) ? 1 : current + 1);
    }
    next();
});
//# sourceMappingURL=fhir-resource-schema.js.map