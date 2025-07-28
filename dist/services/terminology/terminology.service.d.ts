import { ConfigService } from '@nestjs/config';
export declare class TerminologyService {
    private readonly _config;
    tokenUrl: string;
    enabled: boolean;
    baseUrl: string;
    username: string;
    password: string;
    constructor(_config: ConfigService);
    lookup(valueSet: string): Promise<any>;
    getToken(): Promise<string>;
}
