import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValueSetStatus } from '../schema/value-set.schema';

/**
 * DTO for identifier elements in ValueSet resources.
 * Represents business identifiers for the ValueSet.
 */
export class IdentifierDto {
  @ApiPropertyOptional({
    description: 'The purpose of this identifier',
    example: 'official'
  })
  @IsOptional()
  @IsString()
  use?: string;

  @ApiPropertyOptional({
    description: 'Description of identifier',
    example: 'OID'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'The namespace for the identifier value',
    example: 'urn:oid:'
  })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({
    description: 'The value that is unique',
    example: '2.16.840.1.113883.4.642.3.1'
  })
  @IsOptional()
  @IsString()
  value?: string;
}

/**
 * DTO for contact detail information in ValueSet resources.
 * Represents contact information for the ValueSet publisher.
 */
export class ContactDetailDto {
  @ApiPropertyOptional({
    description: 'Name of contact person',
    example: 'FHIR project team'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Contact details',
    type: [String],
    example: ['http://hl7.org/fhir']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  telecom?: string[];
}

/**
 * DTO for coding elements in ValueSet resources.
 * Represents a code from a terminology system.
 */
export class CodingDto {
  @ApiPropertyOptional({
    description: 'Identity of the terminology system',
    example: 'http://hl7.org/fhir/administrative-gender'
  })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({
    description: 'Version of the system',
    example: '4.0.1'
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Symbol in syntax defined by the system',
    example: 'male'
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Representation defined by the system',
    example: 'Male'
  })
  @IsOptional()
  @IsString()
  display?: string;

  @ApiPropertyOptional({
    description: 'If this coding was chosen directly by the user',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  userSelected?: boolean;
}

/**
 * DTO for ValueSet concepts.
 * Represents individual codes included in the ValueSet.
 */
export class ValueSetConceptDto {
  @ApiProperty({
    description: 'Code or expression from system',
    example: 'male'
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Text to display for this code',
    example: 'Male'
  })
  @IsOptional()
  @IsString()
  display?: string;
}

/**
 * DTO for ValueSet filters.
 * Defines criteria for including codes from a code system.
 */
export class ValueSetFilterDto {
  @ApiProperty({
    description: 'A property/filter defined by the code system',
    example: 'concept'
  })
  @IsString()
  property: string;

  @ApiProperty({
    description: 'Filter operation',
    example: 'is-a',
    enum: ['=', 'is-a', 'descendent-of', 'is-not-a', 'regex', 'in', 'not-in', 'generalizes', 'exists']
  })
  @IsString()
  op: string;

  @ApiProperty({
    description: 'Code from the system, or regex criteria',
    example: 'Organism'
  })
  @IsString()
  value: string;
}

/**
 * DTO for ValueSet include/exclude elements.
 * Specifies which codes to include or exclude from code systems.
 */
export class ValueSetIncludeDto {
  @ApiPropertyOptional({
    description: 'The system the codes come from',
    example: 'http://hl7.org/fhir/administrative-gender'
  })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({
    description: 'Specific version of the code system',
    example: '4.0.1'
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'A concept defined in the system',
    type: [ValueSetConceptDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetConceptDto)
  concept?: ValueSetConceptDto[];

  @ApiPropertyOptional({
    description: 'Select codes/concepts by their properties',
    type: [ValueSetFilterDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetFilterDto)
  filter?: ValueSetFilterDto[];

  @ApiPropertyOptional({
    description: 'Select the contents included in this value set',
    type: [String],
    example: ['http://hl7.org/fhir/ValueSet/related-valueset']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valueSet?: string[];
}

/**
 * DTO for ValueSet compose element.
 * Defines the content logical definition of the ValueSet.
 */
export class ValueSetComposeDto {
  @ApiPropertyOptional({
    description: 'Fixed date for references with no specified version',
    example: '2023-01-01'
  })
  @IsOptional()
  @IsDateString()
  lockedDate?: string;

  @ApiPropertyOptional({
    description: 'Whether inactive codes are in the value set',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  inactive?: boolean;

  @ApiProperty({
    description: 'Include one or more codes from a code system',
    type: [ValueSetIncludeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetIncludeDto)
  include: ValueSetIncludeDto[];

  @ApiPropertyOptional({
    description: 'Explicitly exclude codes from a code system',
    type: [ValueSetIncludeDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetIncludeDto)
  exclude?: ValueSetIncludeDto[];
}

/**
 * DTO for creating new FHIR ValueSet resources.
 * Contains all required and optional fields for ValueSet creation with validation.
 */
export class CreateValueSetDto {
  @ApiProperty({
    description: 'Canonical identifier for this value set, represented as a URI',
    example: 'http://hl7.org/fhir/ValueSet/administrative-gender'
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Additional identifier for the value set (business identifier)',
    type: [IdentifierDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentifierDto)
  identifier?: IdentifierDto[];

  @ApiPropertyOptional({
    description: 'Business version of the value set',
    example: '4.0.1'
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Name for this value set (computer friendly)',
    example: 'AdministrativeGender'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Name for this value set (human friendly)',
    example: 'Administrative Gender'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'The status of this value set',
    enum: ValueSetStatus,
    example: ValueSetStatus.ACTIVE
  })
  @IsEnum(ValueSetStatus)
  status: ValueSetStatus;

  @ApiPropertyOptional({
    description: 'For testing purposes, not real usage',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  experimental?: boolean;

  @ApiPropertyOptional({
    description: 'Date last changed',
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Name of the publisher (organization or individual)',
    example: 'HL7 (FHIR Project)'
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Contact details for the publisher',
    type: [ContactDetailDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDetailDto)
  contact?: ContactDetailDto[];

  @ApiPropertyOptional({
    description: 'Natural language description of the value set',
    example: 'The gender of a person used for administrative purposes'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether or not any change to the content logical definition may occur',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  immutable?: boolean;

  @ApiPropertyOptional({
    description: 'Why this value set is defined',
    example: 'To provide a standard set of gender codes for administrative use'
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Use and/or publishing restrictions',
    example: 'Copyright HL7. Licensed under creative commons public domain'
  })
  @IsOptional()
  @IsString()
  copyright?: string;

  @ApiPropertyOptional({
    description: 'Content logical definition of the value set',
    type: ValueSetComposeDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ValueSetComposeDto)
  compose?: ValueSetComposeDto;
}