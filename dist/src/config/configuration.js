"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const process = require("node:process");
exports.default = () => {
    const env = process.env.ENV_NAME;
    const configFilePath = (0, path_1.resolve)(__dirname, `../../../config/${env}.json`);
    if ((0, fs_1.existsSync)(configFilePath)) {
        const config = (0, fs_1.readFileSync)(configFilePath, 'utf8').toString();
        return JSON.parse(config);
    }
    else {
        throw new common_1.HttpException(`Config file ${configFilePath} not found`, common_1.HttpStatus.NOT_FOUND, {
            description: `Config file ${configFilePath} not found`
        });
    }
};
//# sourceMappingURL=configuration.js.map