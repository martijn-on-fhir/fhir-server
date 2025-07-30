import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }
  
  @Get()
  version(): string {
    return 'Fhir 4.0.0';
  }
  
  @Get('readiness')
  healthcheck(): string {
    return 'ok';
  }
}
