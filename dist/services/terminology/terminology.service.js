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
exports.TerminologyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const lodash_es_1 = require("lodash-es");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const value_set_schema_1 = require("../../schema/value-set-schema");
let TerminologyService = class TerminologyService {
    _config;
    _model;
    enabled = false;
    baseUrl = '';
    token;
    constructor(_config, _model) {
        this._config = _config;
        this._model = _model;
        this.baseUrl = this._config.get('terminology.baseUrl');
        this.enabled = this._config.get('terminology.enabled');
    }
    async lookup(valueSet) {
        if (valueSet.indexOf('|') !== -1) {
            valueSet = valueSet.split('|')[0];
        }
        const document = await this._find(valueSet);
        if (document) {
            return document.toObject().expansion;
        }
        if (this.enabled) {
            if (!this.token) {
                this.token = await this._getToken();
            }
            const config = {
                baseURL: this.baseUrl,
                url: `fhir/ValueSet/$expand?url=${valueSet}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${this.token}`,
                },
            };
            return await axios_1.default.request(config).then((response) => {
                if (!document) {
                    this._model.create({
                        url: response.data.url,
                        version: '1.0.0',
                        resourceType: response.data.resourceType,
                        expansion: response.data.expansion.contains,
                        value: response.data,
                    });
                }
                return (0, lodash_es_1.get)(response.data.expansion, 'contains', null);
            }).catch(() => {
                return null;
            });
        }
    }
    async _find(valueSet) {
        return await this._model.findOne({ url: valueSet });
    }
    async _getToken() {
        const config = {
            url: this._config.get('terminology.tokenUrl'),
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
                username: this._config.get('terminology.username'),
                password: this._config.get('terminology.password'),
                client_id: 'cli_client',
                client_secret: '',
                grant_type: 'password',
            },
        };
        return await axios_1.default.request(config).then((response) => {
            return response.data.access_token;
        }).catch((error) => {
            if (error.response.status === axios_1.HttpStatusCode.Unauthorized) {
                throw new Error('Unauthorized');
            }
            throw new Error(error);
        });
    }
};
exports.TerminologyService = TerminologyService;
exports.TerminologyService = TerminologyService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(value_set_schema_1.ValueSetSchema.name)),
    __metadata("design:paramtypes", [config_1.ConfigService, mongoose_2.Model])
], TerminologyService);
//# sourceMappingURL=terminology.service.js.map