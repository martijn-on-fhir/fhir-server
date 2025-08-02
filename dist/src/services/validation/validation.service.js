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
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const structure_definition_schema_1 = require("../../schema/structure-definition.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const fhirPath = require("fhirpath");
const lodash_es_1 = require("lodash-es");
const terminology_service_1 = require("../terminology/terminology.service");
const fhirModel = require("fhirpath/fhir-context/r4");
const validate_type_1 = require("../../lib/validation/validate-type");
let ValidationService = class ValidationService {
    structureDefinitionModel;
    _terminologyService;
    resource;
    resourceType;
    structureDefinition;
    elements = new Map();
    slices = new Map();
    constructor(structureDefinitionModel, _terminologyService) {
        this.structureDefinitionModel = structureDefinitionModel;
        this._terminologyService = _terminologyService;
    }
    async validateResource(resource) {
        const errors = [];
        const warnings = [];
        this.resourceType = resource.resourceType;
        this.resource = resource;
        if (!this.resourceType) {
            return {
                isValid: false,
                errors: [{
                        path: 'resourceType',
                        message: 'Resource should contain a resourceType property',
                        severity: 'error',
                        code: 'required'
                    }],
                warnings: []
            };
        }
        this.structureDefinition = await this.getStructureDefinition(this.resourceType, this.resource?.profile).then((response) => {
            return response?.definition ?? null;
        });
        if (!this.structureDefinition) {
            return {
                isValid: false,
                errors: [{
                        path: 'resourceType',
                        message: `No structure definition for resource type: ${this.resourceType}`,
                        severity: 'error',
                        code: 'unknown-resource-type'
                    }],
                warnings: []
            };
        }
        this.parseStructureDefinition();
        const validationResult = await this.validate(this.resource);
        validationResult.errors.forEach(error => {
            console.log(`  - ${error.path}: ${error.message}`);
        });
        return validationResult;
    }
    parseStructureDefinition() {
        this.elements.clear();
        this.structureDefinition.snapshot.element.forEach(element => {
            this.elements.set(element.path, element);
            if (element.sliceName) {
                const basePath = element.path;
                if (!this.slices.has(basePath)) {
                    this.slices.set(basePath, []);
                }
                this.slices.get(basePath).push(element);
            }
        });
    }
    async validate(resource) {
        const errors = [];
        const warnings = [];
        try {
            if (resource.resourceType !== this.structureDefinition.type) {
                errors.push({
                    path: 'resourceType',
                    severity: 'error',
                    message: `Expected resourceType '${this.structureDefinition.type}', got '${resource.resourceType}'`
                });
                return { isValid: false, errors, warnings };
            }
            this.validateProfileDeclaration(resource, errors);
            this.checkRootProperties(resource, errors);
            await this.validateElement(this.resourceType, resource, errors, warnings);
        }
        catch (error) {
            errors.push({
                path: 'root',
                severity: 'error',
                message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    validateProfileDeclaration(resource, errors) {
        if (!resource.meta?.profile?.includes(this.structureDefinition.url)) {
            errors.push({
                path: 'meta.profile',
                severity: 'error',
                message: `Resource must declare conformance to profile: ${this.structureDefinition.url}`
            });
        }
    }
    checkRootProperties(resource, errors) {
        const rootProperties = Object.keys(resource).filter(key => !key.startsWith('_'));
        rootProperties.forEach(property => {
            if (!this.elements.has(`${this.resourceType}.${property}`) && property !== 'resourceType') {
                if (property.startsWith('effective') || property.startsWith('deceased') || property.startsWith('multipleBirth')) {
                    return;
                }
                errors.push({
                    path: property,
                    severity: 'error',
                    message: `Unexpected property: ${property}`
                });
            }
        });
    }
    async getStructureDefinition(resourceType, profile) {
        if (typeof resourceType !== 'string') {
            return null;
        }
        if (profile !== undefined) {
            if (Array.isArray(profile)) {
                if (!profile.every(p => typeof p === 'string')) {
                    return null;
                }
            }
            else if (typeof profile !== 'string') {
                return null;
            }
        }
        const filter = {
            resourceType: resourceType
        };
        if (profile) {
            Object.assign(filter, {
                url: Array.isArray(profile) ? (0, lodash_es_1.first)(profile) : profile
            });
        }
        return this.structureDefinitionModel.findOne(filter).exec();
    }
    async validateChildElements(path, value, errors, warnings) {
        if (!value || typeof value !== 'object') {
            return;
        }
        const childElements = Array.from(this.elements.keys())
            .filter(elementPath => elementPath.startsWith(path + '.') &&
            elementPath.split('.').length === path.split('.').length + 1);
        for (const childPath of childElements) {
            const childProperty = childPath.split('.').pop();
            const childValue = value[childProperty];
            if (Array.isArray(childValue)) {
                for (const item of childValue) {
                    await this.validateElement(childPath, item, errors, warnings);
                }
            }
            else {
                await this.validateElement(childPath, childValue, errors, warnings);
            }
        }
    }
    async validateElement(path, value, errors, warnings) {
        const elementDef = this.elements.get(path);
        if (!elementDef) {
            return;
        }
        this.validateCardinality(path, value, elementDef, errors);
        this.validateDataType(value, elementDef, errors);
        await this.validateConstraints(path, value, elementDef, errors, warnings);
        this.validatePatterns(path, value, elementDef, errors);
        await this.validateChildElements(path, value, errors, warnings);
    }
    validateCardinality(path, value, elementDef, errors) {
        if (value === undefined || value === null) {
            const base = elementDef?.base;
            const types = this.normalizeTypes(elementDef.type);
            if (path.endsWith('value[x]') && Array.isArray(types) && base) {
                types.forEach((type) => {
                    const expression = path.replace('value[x]', `value${type.code}`).split('.').slice(1).join('.');
                    const entities = fhirPath.evaluate(this.resource, expression, {});
                    if (Array.isArray(entities) && entities.length >= 1) {
                        value = (0, lodash_es_1.first)(entities);
                    }
                });
            }
            if (elementDef.min > 0 && !value) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Required element '${path}' is missing (min cardinality: ${elementDef.min})`
                });
            }
            return;
        }
        if (Array.isArray(value)) {
            if (value.length < elementDef.min) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Element '${path}' has ${value.length} items, minimum required: ${elementDef.min}`
                });
            }
            if (elementDef.max !== '*' && value.length > parseInt(elementDef.max)) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Element '${path}' has ${value.length} items, maximum allowed: ${elementDef.max}`
                });
            }
        }
        else if (elementDef.max !== '*' && parseInt(elementDef.max) < 1) {
            errors.push({
                path,
                severity: 'error',
                message: `Element '${path}' should not be present (max cardinality: ${elementDef.max})`
            });
        }
    }
    validateDataType(value, elementDef, errors) {
        if (!elementDef.type || value === undefined || value === null)
            return;
        const validator = new validate_type_1.ValidateType(elementDef);
        if (!validator.isValid(value)) {
            errors.push(validator.getErrorMessage());
        }
    }
    _toBoolean(result) {
        return Array.isArray(result) && result[0] === true;
    }
    evaluateConstraint(expression, value, path) {
        if (!value) {
            return true;
        }
        try {
            const result = this._toBoolean(fhirPath.evaluate(this.resource, expression, {
                base: path
            }, fhirModel));
            if (!result && path === 'Observation.component') {
                return true;
            }
            return result;
        }
        catch {
            return true;
        }
    }
    async validateConstraints(path, value, elementDef, errors, warnings) {
        if (!elementDef.constraint)
            return;
        const valueSet = elementDef.binding?.valueSet;
        if (value && valueSet) {
            const collection = await this._terminologyService.lookup(valueSet);
            if (Array.isArray(collection)) {
                const exists = collection.find((item) => {
                    if (typeof value === 'string') {
                        return item.code === value;
                    }
                    return item.code === value.coding[0].code;
                });
                if (!exists) {
                    const allowed = collection.map((item) => {
                        return item.code.toLowerCase() === item.display.toLowerCase() ? item.code : `${item.code} - ${item.display}`;
                    }).join(', ');
                    errors.push({
                        path,
                        severity: 'error',
                        message: `Value not allowed, possible values are: ${allowed}`
                    });
                }
            }
        }
        for (const constraint of elementDef.constraint) {
            try {
                if (!value && elementDef.min === 0) {
                    return;
                }
                const isValid = this.evaluateConstraint(constraint.expression, value, path);
                if (!isValid) {
                    const validationItem = {
                        path,
                        message: constraint.human,
                        constraint: constraint.key,
                        expression: constraint.expression
                    };
                    if (constraint.severity === 'error') {
                        errors.push({ ...validationItem, severity: 'error' });
                    }
                    else {
                        warnings.push(validationItem);
                    }
                }
            }
            catch (error) {
                warnings.push({
                    path,
                    message: `Could not evaluate constraint ${constraint.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }
    }
    validatePatterns(path, value, elementDef, errors) {
        let pattern;
        for (const property in elementDef) {
            if (property.startsWith('pattern') && property) {
                pattern = property.substring('pattern'.length, property.length);
            }
        }
        if (pattern && value) {
            const r = fhirPath.evaluate(this.resource, `${path}.exists($this is ${pattern})`, {
                base: path
            }, fhirModel);
            if (!this._toBoolean(r)) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Value does not match required pattern for ${path}`
                });
            }
        }
        if (elementDef.fixedUri && value !== elementDef.fixedUri) {
            errors.push({
                path,
                severity: 'error',
                message: `Expected fixed value '${elementDef.fixedUri}', got '${value}'`
            });
        }
    }
    normalizeTypes(types) {
        if (types) {
            return types.map(type => {
                return {
                    code: type.code.charAt(0).toUpperCase() + type.code.slice(1),
                    profile: type.profile
                };
            });
        }
        return types;
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(structure_definition_schema_1.StructureDefinitionSchema.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        terminology_service_1.TerminologyService])
], ValidationService);
//# sourceMappingURL=validation.service.js.map