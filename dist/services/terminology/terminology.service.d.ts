import { ConfigService } from '@nestjs/config';
export declare class TerminologyService {
    private readonly _config;
    enabled: boolean;
    baseUrl: string;
    constructor(_config: ConfigService);
    lookup(valueSet: string): Promise<any>;
    getToken(): Promise<string>;
}
