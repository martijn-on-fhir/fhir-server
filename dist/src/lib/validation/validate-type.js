"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateType = void 0;
class ValidateType {
    elementDef;
    value;
    expectedTypes = [];
    error;
    path;
    message;
    constructor(elementDef) {
        this.elementDef = elementDef;
        elementDef.type?.map(type => {
            this.expectedTypes.push(this.normalize(type.code));
        });
        this.path = elementDef.path ?? 'Unkown';
    }
    isValid(value) {
        if (value === null || value === undefined) {
            return true;
        }
        const errors = [];
        for (const type of this.expectedTypes) {
            if (typeof this[`isValid${type}`] === 'function') {
                const valid = this[`isValid${type}`](value);
                if (valid !== true) {
                    errors.push(type);
                }
            }
            else {
                console.log(`Missing type validation: ${type}`);
            }
        }
        return Array.isArray(errors) && errors.length === 0;
    }
    isValidMeta(value) {
        return typeof value === 'object' && Array.isArray(value.profile);
    }
    isValidNarrative(value) {
        return typeof value === 'object' &&
            typeof value.status === 'string' &&
            typeof value.div === 'string';
    }
    isValidExtension(value) {
        return typeof value === 'object' && typeof value.url === 'string';
    }
    isValidReference(value) {
        return typeof value === 'object';
    }
    isValidIdentifier(value) {
        return typeof value === 'object' && typeof value.system === 'string';
    }
    isValidCode(value) {
        return typeof value === 'string' && value.length > 0;
    }
    isValidString(value) {
        return typeof value === 'string' && value.length > 0;
    }
    isValidCodeableConcept(value) {
        return value && typeof value === 'object' && (Array.isArray(value.coding) || typeof value.text === 'string');
    }
    isValidBackboneElement(value) {
        return typeof value === 'object';
    }
    isValidCoding(value) {
        return typeof value === 'object' && typeof value.system === 'string' && typeof value.code === 'string';
    }
    isValidInstant(value) {
        if (typeof value !== 'string') {
            return false;
        }
        const patetrn = /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2}))?)?)?$/;
        return Array.isArray(value.match(patetrn));
    }
    isValidAnnotation(value) {
        return typeof value === 'object' && typeof value.text === 'string';
    }
    isValidMarkdown(value) {
        return typeof value === 'string';
    }
    getErrorMessage() {
        return {
            path: this.path,
            message: `Invalid type for ${this.elementDef.path}. Expected ${this.expectedTypes.join(', ')}.`,
            severity: 'error'
        };
    }
    normalize(label) {
        if (label.startsWith('http')) {
            const parts = label.split('.');
            const lastPart = parts.length > 1 ? parts[parts.length - 1] : label;
            return this.normalize(lastPart);
        }
        else {
            return label.charAt(0).toUpperCase() + label.slice(1);
        }
    }
}
exports.ValidateType = ValidateType;
//# sourceMappingURL=validate-type.js.map