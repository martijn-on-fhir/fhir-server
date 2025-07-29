import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ValueSetDocument } from '../../schema/value-set-schema';
export declare class TerminologyService {
    private readonly _config;
    private model;
    enabled: boolean;
    baseUrl: string;
    token: string;
    constructor(_config: ConfigService, model: Model<ValueSetDocument>);
    lookup(valueSet: string): Promise<any>;
    find(valueSet: string): Promise<ValueSetDocument | null>;
    getToken(): Promise<string>;
}
