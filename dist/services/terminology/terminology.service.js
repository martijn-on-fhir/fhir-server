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
exports.TerminologyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const lodash_es_1 = require("lodash-es");
let TerminologyService = class TerminologyService {
    _config;
    enabled = false;
    baseUrl = '';
    constructor(_config) {
        this._config = _config;
        this.baseUrl = this._config.get('terminology.baseUrl');
        this.enabled = this._config.get('terminology.enabled');
    }
    async lookup(valueSet) {
        if (this.enabled) {
            const token = await this.getToken();
            const config = {
                baseURL: this.baseUrl,
                url: `fhir/ValueSet/$expand?url=${valueSet}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${token}`,
                }
            };
            return await axios_1.default.request(config).then((response) => {
                return (0, lodash_es_1.get)(response.data.expansion, 'contains', null);
            }).catch(() => {
                return null;
            });
        }
    }
    async getToken() {
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], TerminologyService);
//# sourceMappingURL=terminology.service.js.map