import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { FhirMetaCreateDto } from './fhir-meta-create-dto'

export class CreateResourceDto {
  @ApiProperty({
    description: 'The type of FHIR resource',
    example: 'Patient',
    examples: {
      patient: { value: 'Patient' },
      observation: { value: 'Observation' },
      practitioner: { value: 'Practitioner' },
      organization: { value: 'Organization' }
    }
  })
  @IsString()
  @IsNotEmpty()
  resourceType: string
  
  @ApiPropertyOptional({
    description: 'Logical id of this artifact (auto-generated if not provided)',
    example: 'patient-123'
  })
  @IsOptional()
  @IsString()
  id?: string
  
  @ApiPropertyOptional({
    description: 'Metadata about the resource',
    type: () => FhirMetaCreateDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FhirMetaCreateDto)
  meta?: FhirMetaCreateDto
  
  @ApiPropertyOptional({
    description: 'A set of rules under which this content was created',
    example: 'http://hl7.org/fhir/StructureDefinition/Patient'
  })
  @IsOptional()
  @IsUrl()
  implicitRules?: string
  
  @ApiPropertyOptional({
    description: 'Language of the resource content (BCP-47)',
    example: 'en-US'
  })
  @IsOptional()
  @IsString()
  language?: string
  
  @ApiPropertyOptional({
    description: 'Text summary of the resource, for human interpretation',
    example: { status: 'generated', div: '<div>Patient summary</div>' }
  })
  @IsOptional()
  @IsObject()
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  }
  
  @ApiPropertyOptional({
    description: 'Contained, inline Resources',
    type: [Object]
  })
  @IsOptional()
  contained?: any[]
  
  @ApiPropertyOptional({
    description: 'Additional content defined by implementations',
    type: [Object]
  })
  @IsOptional()
  extension?: any[]
  
  @ApiPropertyOptional({
    description: 'Extensions that cannot be ignored',
    type: [Object]
  })
  @IsOptional()
  modifierExtension?: any[]
  
  [key: string]: any;
}
