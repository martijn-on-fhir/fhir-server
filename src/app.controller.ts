import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { TerminologyService } from './services/terminology/terminology.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly service: TerminologyService) {
  }
  
  @Get()
  version(): string {
    return 'Fhir 4.0.0';
  }
  
  @Get('readiness')
  healthcheck(): string {
    return 'ok';
  }
  
  @Get('token')
  async token(): Promise<string>{
    
    return await this.service._getToken()
  }
}
