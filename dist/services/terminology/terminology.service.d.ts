import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ValueSetDocument } from '../../schema/value-set-schema';
export declare class TerminologyService {
    private readonly _config;
    private _model;
    enabled: boolean;
    baseUrl: string;
    token: string;
    constructor(_config: ConfigService, _model: Model<ValueSetDocument>);
    lookup(valueSet: string): Promise<any>;
    private _find;
    private _getToken;
}
