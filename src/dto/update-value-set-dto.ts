import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValueSetStatus } from '../schema/value-set.schema';
import {
  IdentifierDto,
  ContactDetailDto,
  ValueSetIncludeDto
} from './create-value-set-dto';

/**
 * DTO for ValueSet compose structure in updates.
 * Makes the required 'include' field optional for partial updates.
 */
export class UpdateValueSetComposeDto {
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

  @ApiPropertyOptional({
    description: 'Include one or more codes from a code system',
    type: [ValueSetIncludeDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetIncludeDto)
  include?: ValueSetIncludeDto[];

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
 * DTO for updating ValueSet resources.
 * All fields from CreateValueSetDto are made optional for partial updates.
 */
export class UpdateValueSetDto {
  
  @ApiPropertyOptional({
    description: 'Business identifier for the resource',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Resource type - should always be ValueSet',
    example: 'ValueSet',
    default: 'ValueSet',
    readOnly: true
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Canonical identifier for this value set, represented as a URI',
    example: 'http://hl7.org/fhir/ValueSet/administrative-gender'
  })
  @IsOptional()
  @IsString()
  url?: string;

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

  @ApiPropertyOptional({
    description: 'The status of this value set',
    enum: ValueSetStatus,
    example: ValueSetStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ValueSetStatus)
  status?: ValueSetStatus;

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
    type: UpdateValueSetComposeDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateValueSetComposeDto)
  compose?: UpdateValueSetComposeDto;
}