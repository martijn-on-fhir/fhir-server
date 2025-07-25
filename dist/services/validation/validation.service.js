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
const lodash_es_1 = require("lodash-es");
const fhirPath = require("fhirpath");
let ValidationService = class ValidationService {
    structureDefinitionModel;
    structureDefinition;
    elements = new Map();
    slices = new Map();
    constructor(structureDefinitionModel) {
        this.structureDefinitionModel = structureDefinitionModel;
    }
    async validateResource(resource) {
        const errors = [];
        const warnings = [];
        const resourceType = resource.resourceType;
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
        this.structureDefinition = await this.getStructureDefinition(resourceType, resource?.profile).then((response) => {
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
        const validationResult = this.validate(resource);
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
    validate(resource) {
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
            this.validateElement('Observation', resource, errors, warnings);
            this.validateProfileSpecificConstraints(resource, errors);
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
    validateChildElements(path, value, errors, warnings) {
        if (!value || typeof value !== 'object') {
            return;
        }
        const childElements = Array.from(this.elements.keys())
            .filter(elementPath => elementPath.startsWith(path + '.') &&
            elementPath.split('.').length === path.split('.').length + 1);
        childElements.forEach(childPath => {
            const childProperty = childPath.split('.').pop();
            const childValue = value[childProperty];
            if (Array.isArray(childValue)) {
                childValue.forEach((item) => {
                    this.validateElement(childPath, item, errors, warnings);
                });
            }
            else {
                this.validateElement(childPath, childValue, errors, warnings);
            }
        });
    }
    validateElement(path, value, errors, warnings) {
        const elementDef = this.elements.get(path);
        if (!elementDef) {
            return;
        }
        this.validateCardinality(path, value, elementDef, errors);
        this.validateDataType(path, value, elementDef, errors);
        this.validateConstraints(path, value, elementDef, errors, warnings);
        this.validatePatterns(path, value, elementDef, errors);
        this.validateChildElements(path, value, errors, warnings);
    }
    validateCardinality(path, value, elementDef, errors) {
        if (value === undefined || value === null) {
            if (elementDef.min > 0) {
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
    validateConstraints(path, value, elementDef, errors, warnings) {
        if (!elementDef.constraint)
            return;
        elementDef.constraint.forEach(constraint => {
            try {
                let isValid = this.evaluateConstraint(constraint.expression, value, path);
                isValid = true;
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
        });
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
    validateProfileSpecificConstraints(resource, errors) {
        const hasVitalSignsCategory = resource.category?.some((cat) => cat.coding?.some((coding) => coding.system === 'http://terminology.hl7.org/CodeSystem/observation-category' &&
            coding.code === 'vital-signs'));
        if (!hasVitalSignsCategory) {
            errors.push({
                path: 'category',
                severity: 'error',
                message: 'Blood pressure observation must have vital-signs category',
            });
        }
        const hasRequiredCode = resource.code?.coding?.some((coding) => coding.system === 'http://loinc.org' && coding.code === '85354-9');
        if (!hasRequiredCode) {
            errors.push({
                path: 'code',
                severity: 'error',
                message: 'Blood pressure observation must have LOINC code 85354-9',
            });
        }
        this.validateRequiredComponents(resource, errors);
        this.validateComponentPatterns(resource, errors);
    }
    validateRequiredComponents(resource, errors) {
        if (!resource.component || !Array.isArray(resource.component)) {
            errors.push({
                path: 'component',
                severity: 'error',
                message: 'Blood pressure observation must have component array',
            });
            return;
        }
        const hasSystolic = resource.component.some((comp) => comp.code?.coding?.some((coding) => coding.system === 'http://loinc.org' && coding.code === '8480-6'));
        if (!hasSystolic) {
            errors.push({
                path: 'component',
                severity: 'error',
                message: 'Missing required systolic blood pressure component (LOINC 8480-6)',
            });
        }
        const hasDiastolic = resource.component.some((comp) => comp.code?.coding?.some((coding) => coding.system === 'http://loinc.org' && coding.code === '8462-4'));
        if (!hasDiastolic) {
            errors.push({
                path: 'component',
                severity: 'error',
                message: 'Missing required diastolic blood pressure component (LOINC 8462-4)',
            });
        }
    }
    validateComponentPatterns(resource, errors) {
        if (!resource.component) {
            return;
        }
        resource.component.forEach((component, index) => {
            const basePath = `component[${index}]`;
            if (component.valueQuantity) {
                if (component.valueQuantity.system !== 'http://unitsofmeasure.org' || component.valueQuantity.code !== 'mm[Hg]') {
                    const isBPComponent = component.code?.coding?.some((coding) => ['8480-6', '8462-4', '6797001'].includes(coding.code) &&
                        coding.system === 'http://loinc.org' || coding.system === 'http://snomed.info/sct');
                    if (isBPComponent) {
                        errors.push({
                            path: `${basePath}.valueQuantity`,
                            severity: 'error',
                            message: 'Blood pressure measurements must use mmHg units (mm[Hg])',
                        });
                    }
                }
            }
        });
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
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(structure_definition_schema_1.StructureDefinitionSchema.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], ValidationService);
//# sourceMappingURL=validation.service.js.map