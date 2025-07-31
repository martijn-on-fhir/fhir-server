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
exports.structureDefinitionSchema = exports.StructureDefinitionSchema = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let StructureDefinitionSchema = class StructureDefinitionSchema {
    resourceType;
    url;
    release;
    definition;
};
exports.StructureDefinitionSchema = StructureDefinitionSchema;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], StructureDefinitionSchema.prototype, "resourceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true
    }),
    __metadata("design:type", String)
], StructureDefinitionSchema.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        default: '4',
        index: true
    }),
    __metadata("design:type", Number)
], StructureDefinitionSchema.prototype, "release", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], StructureDefinitionSchema.prototype, "definition", void 0);
exports.StructureDefinitionSchema = StructureDefinitionSchema = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'structure-definitions',
        timestamps: { createdAt: true, updatedAt: false },
        strict: false,
        versionKey: false
    })
], StructureDefinitionSchema);
exports.structureDefinitionSchema = mongoose_1.SchemaFactory.createForClass(StructureDefinitionSchema);
exports.structureDefinitionSchema.index({ resourceType: 1, url: 1, release: 1 });
//# sourceMappingURL=structure-definition.schema.js.map