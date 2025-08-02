import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUrl } from 'class-validator'

export class FhirMetaCreateDto {
  
  @ApiPropertyOptional({
    description: 'Profiles this resource claims conformance to',
    type: [String],
    example: ['http://hl7.org/fhir/StructureDefinition/Patient']
  })
  
  @IsOptional()
  @IsString({ each: true })
  profile?: string[];
  
  @ApiPropertyOptional({
    description: 'Security Labels applied to this resource',
    example: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST' }]
  })
  @IsOptional()
  security?: any[];
  
  @ApiPropertyOptional({
    description: 'Tags applied to this resource',
    example: [{ system: 'http://example.org/tags', code: 'workflow' }]
  })
  @IsOptional()
  tag?: any[];
  
  @ApiPropertyOptional({ description: 'Identifies where the resource comes from' })
  @IsOptional()
  @IsUrl()
  source?: string;
}
