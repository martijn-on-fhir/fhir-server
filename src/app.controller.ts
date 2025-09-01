import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, HealthCheckResult, HealthIndicatorResult, MongooseHealthIndicator } from '@nestjs/terminus'

/**
 * Main application controller handling health checks and version info.
 * Provides endpoints for monitoring service status and FHIR version information.
 */
@ApiTags('Health Check')
@Controller()
export class AppController {
  
  constructor( private health: HealthCheckService, private memory: MemoryHealthIndicator,
               private mongoose: MongooseHealthIndicator) {}
  
  @Get()
  @ApiOperation({ summary: 'Get FHIR version', description: 'Returns the supported FHIR version' })
  @ApiResponse({ status: 200, description: 'Returns FHIR version string' })
  version(): string {
    return 'Fhir 4.0.0';
  }
  
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness check', description: 'Checks if the service is ready to accept requests' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  healthcheck(): string {
    return 'ok';
  }
  
  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Memory heap check', description: 'Checks memory heap usage against threshold' })
  @ApiResponse({ status: 200, description: 'Memory heap check results' })
  memoryCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
  
  @Get('checkRSS')
  @HealthCheck()
  @ApiOperation({ summary: 'RSS memory check', description: 'Checks RSS memory usage against threshold' })
  @ApiResponse({ status: 200, description: 'RSS memory check results' })
  checkRSS(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }
  
  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check', description: 'Checks database connection status' })
  @ApiResponse({ status: 200, description: 'Database health check results' })
  databaseCheck(): Promise<HealthCheckResult> {
    return this.health.check([async (): Promise<HealthIndicatorResult<'mongoose'>> => this.mongoose.pingCheck('mongoose')]);
  }
}
