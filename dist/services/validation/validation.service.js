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
let ValidationService = class ValidationService {
    structureDefinitionModel;
    _terminologyService;
    resource;
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
        const resourceType = resource.resourceType;
        this.resource = resource;
        if (!resourceType) {
            return {
                isValid: false,
                errors: [{
                        path: 'resourceType',
                        message: 'Resource should contain a resourceType property',
                        severity: 'error',
                        code: 'required',
                    }],
                warnings: [],
            };
        }
        this.structureDefinition = await this.getStructureDefinition(resourceType, this.resource?.profile).then((response) => {
            return response?.definition ?? null;
        });
        if (!this.structureDefinition) {
            return {
                isValid: false,
                errors: [{
                        path: 'resourceType',
                        message: `No structure definition for resource type: ${resourceType}`,
                        severity: 'error',
                        code: 'unknown-resource-type',
                    }],
                warnings: [],
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
                    message: `Expected resourceType '${this.structureDefinition.type}', got '${resource.resourceType}'`,
                });
                return { isValid: false, errors, warnings };
            }
            this.validateProfileDeclaration(resource, errors);
            await this.validateElement('Observation', resource, errors, warnings);
        }
        catch (error) {
            errors.push({
                path: 'root',
                severity: 'error',
                message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    validateProfileDeclaration(resource, errors) {
        if (!resource.meta?.profile?.includes(this.structureDefinition.url)) {
            errors.push({
                path: 'meta.profile',
                severity: 'error',
                message: `Resource must declare conformance to profile: ${this.structureDefinition.url}`,
            });
        }
    }
    async getStructureDefinition(resourceType, profile) {
        const filter = {
            resourceType: resourceType,
        };
        if (profile) {
            Object.assign(filter, {
                url: Array.isArray(profile) ? (0, lodash_es_1.first)(profile) : profile,
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
        this.validateDataType(path, value, elementDef, errors);
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
                    message: `Required element '${path}' is missing (min cardinality: ${elementDef.min})`,
                });
            }
            return;
        }
        if (Array.isArray(value)) {
            if (value.length < elementDef.min) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Element '${path}' has ${value.length} items, minimum required: ${elementDef.min}`,
                });
            }
            if (elementDef.max !== '*' && value.length > parseInt(elementDef.max)) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Element '${path}' has ${value.length} items, maximum allowed: ${elementDef.max}`,
                });
            }
        }
        else if (elementDef.max !== '*' && parseInt(elementDef.max) < 1) {
            errors.push({
                path,
                severity: 'error',
                message: `Element '${path}' should not be present (max cardinality: ${elementDef.max})`,
            });
        }
    }
    validateDataType(path, value, elementDef, errors) {
        if (!elementDef.type || value === undefined || value === null)
            return;
        if (path.includes('valueQuantity') && !this.isValidQuantity(value)) {
            errors.push({
                path,
                severity: 'error',
                message: 'Invalid Quantity structure',
            });
        }
        if (path.includes('valueCodeableConcept') && !this.isValidCodeableConcept(value)) {
            errors.push({
                path,
                severity: 'error',
                message: 'Invalid CodeableConcept structure',
            });
        }
    }
    isValidQuantity(value) {
        return value &&
            typeof value === 'object' &&
            typeof value.value === 'number' &&
            typeof value.unit === 'string' &&
            typeof value.system === 'string' &&
            typeof value.code === 'string';
    }
    evaluateConstraint(expression, value, path) {
        try {
            if (expression.includes('exists()')) {
                return value !== undefined && value !== null;
            }
            if (expression.includes('empty()')) {
                const result = fhirPath.evaluate(value, expression, {
                    base: path,
                });
                const isError = Array.isArray(result) ? result[0] === true : Boolean(result);
                return isError;
            }
            if (expression.includes('.length()')) {
                const match = expression.match(/\.length\(\)\s*>=\s*(\d+)/);
                if (match && typeof value === 'string') {
                    return value.length >= parseInt(match[1]);
                }
            }
            return true;
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
                    errors.push({ path,
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
                    message: `Could not evaluate constraint ${constraint.key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
            }
        }
    }
    validatePatterns(path, value, elementDef, errors) {
        if (elementDef.patternCodeableConcept && value) {
            const isValid = this.matchesCodeableConceptPattern(value, elementDef.patternCodeableConcept);
            if (!isValid) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Value does not match required pattern for ${path}`,
                });
            }
        }
        if (elementDef.patternQuantity && value) {
            const isValid = this.matchesQuantityPattern(value, elementDef.patternQuantity);
            if (!isValid) {
                errors.push({
                    path,
                    severity: 'error',
                    message: `Quantity does not match required pattern for ${path}`,
                });
            }
        }
        if (elementDef.fixedUri && value !== elementDef.fixedUri) {
            errors.push({
                path,
                severity: 'error',
                message: `Expected fixed value '${elementDef.fixedUri}', got '${value}'`,
            });
        }
    }
    isValidCodeableConcept(value) {
        return value && typeof value === 'object' && (Array.isArray(value.coding) || typeof value.text === 'string');
    }
    matchesCodeableConceptPattern(value, pattern) {
        if (!pattern.coding || !value.coding) {
            return true;
        }
        return pattern.coding.every((patternCoding) => value.coding.some((valueCoding) => {
            return valueCoding.system === patternCoding.system && valueCoding.code === patternCoding.code;
        }));
    }
    matchesQuantityPattern(value, pattern) {
        return (!pattern.system || value.system === pattern.system) &&
            (!pattern.code || value.code === pattern.code);
    }
    normalizeTypes(types) {
        if (types) {
            return types.map(type => {
                return {
                    code: type.code.charAt(0).toUpperCase() + type.code.slice(1),
                    profile: type.profile,
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