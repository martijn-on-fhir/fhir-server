import { IsOptional, IsString, IsArray, IsEnum, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FhirSearchParamsDto {
  
  @ApiPropertyOptional({
    description: 'Include related resources',
    example: 'Patient:general-practitioner,Patient:organization',
    isArray: true
  })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  _include?: string[];
  
  @ApiPropertyOptional({
    description: 'Reverse include (resources that reference this resource)',
    example: 'Observation:patient,Encounter:patient',
    isArray: true
  })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  _revinclude?: string[];
  
  @ApiPropertyOptional({
    description: 'Include all referenced resources recursively',
    example: '*'
  })
  @IsOptional()
  @IsString()
    // eslint-disable-next-line @typescript-eslint/naming-convention
  _include_all?: string;
  
  @ApiPropertyOptional({
    description: 'Number of resources to return',
    example: '50'
  })
  @IsOptional()
  @IsNumberString()
  _count?: string;
  
  @ApiPropertyOptional({
    description: 'Search result offset',
    example: '0'
  })
  @IsOptional()
  @IsNumberString()
  _offset?: string;
  
  @ApiPropertyOptional({
    description: 'Include only specific elements',
    example: 'Patient.name,Patient.birthDate',
    isArray: true
  })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  _elements?: string[];
  
  @ApiPropertyOptional({
    description: 'Summary level',
    enum: ['true', 'text', 'data', 'count', 'false']
  })
  @IsOptional()
  @IsEnum(['true', 'text', 'data', 'count', 'false'])
  _summary?: 'true' | 'text' | 'data' | 'count' | 'false';
}
