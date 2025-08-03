import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { FhirMetaCreateDto } from './fhir-meta-create-dto'

/**
 * Data Transfer Object (DTO) for creating FHIR resources.
 * This class defines the structure and validation rules for creating new FHIR resources.
 * It includes common FHIR resource properties like resourceType, id, meta, and extensions.
 * The class supports dynamic properties through an index signature to accommodate different FHIR resource types.
 *
 * @example
 * {
 *   resourceType: "Patient",
 *   id: "patient-123",
 *   meta: {
 *     versionId: "1",
 *     lastUpdated: "2025-08-03T12:00:00Z"
 *   }
 * }
 */
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
  
  /**
   * Contains metadata about the resource such as version ID, last updated timestamp,
   * security labels, tags, and profiles.
   * @see FhirMetaCreateDto for detailed metadata structure
   */
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
  
  /**
   * Index signature to allow additional properties specific to different FHIR resource types.
   * This enables the DTO to handle various resource-specific fields that are not part of the common base properties.
   */
  [key: string]: any;
}
