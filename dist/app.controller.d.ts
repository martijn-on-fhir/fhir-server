import { AppService } from './app.service';
import { TerminologyService } from './services/terminology/terminology.service';
export declare class AppController {
    private readonly appService;
    private readonly service;
    constructor(appService: AppService, service: TerminologyService);
    version(): string;
    healthcheck(): string;
    token(): Promise<string>;
}
