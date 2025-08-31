import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  SearchParameterStatus,
  SearchParameterType,
  XPathUsage,
  SearchComparator,
  SearchModifier
} from '../schema/search-parameter.schema';

export class SearchParameterComponentDto {
  @ApiProperty({
    description: 'Canonical reference to the base SearchParameter',
    example: 'http://hl7.org/fhir/SearchParameter/Patient-name'
  })
  @IsString()
  definition: string;

  @ApiProperty({
    description: 'FHIRPath expression relative to main expression',
    example: 'family | given'
  })
  @IsString()
  expression: string;
}

export class CreateSearchParameterDto {
  
  @ApiProperty({
    description: 'Resource type',
    example: 'SearchParameter',
    default: 'SearchParameter'
  })
  @IsString()
  resourceType: string = 'SearchParameter';

  @ApiProperty({
    description: 'Canonical identifier for this search parameter',
    example: 'http://hl7.org/fhir/SearchParameter/Patient-name'
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Business version of the search parameter',
    example: '4.0.1'
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({
    description: 'Name for this search parameter (computer friendly)',
    example: 'name'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Original definition for the search parameter',
    example: 'http://hl7.org/fhir/SearchParameter/individual-name'
  })
  @IsOptional()
  @IsString()
  derivedFrom?: string;

  @ApiProperty({
    description: 'Publication status',
    enum: SearchParameterStatus,
    example: SearchParameterStatus.ACTIVE
  })
  @IsEnum(SearchParameterStatus)
  status: SearchParameterStatus;

  @ApiPropertyOptional({
    description: 'For testing purposes, not real usage',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  experimental?: boolean;

  @ApiPropertyOptional({
    description: 'Date last changed',
    example: '2019-11-01T09:29:23+11:00'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Name of the publisher',
    example: 'HL7 (FHIR Project)'
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Contact details for the publisher',
    type: 'array',
    items: { type: 'object' }
  })
  @IsOptional()
  @IsArray()
  contact?: any[];

  @ApiProperty({
    description: 'Natural language description of the search parameter',
    example: 'A server defined search that may match any of the string fields in the HumanName'
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'The context that the content is intended to support'
  })
  @IsOptional()
  @IsArray()
  useContext?: any[];

  @ApiPropertyOptional({
    description: 'Intended jurisdiction for search parameter'
  })
  @IsOptional()
  @IsArray()
  jurisdiction?: any[];

  @ApiPropertyOptional({
    description: 'Why this search parameter is defined'
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    description: 'Code used in URL',
    example: 'name'
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'The resource type(s) this search parameter applies to',
    type: [String],
    example: ['Patient']
  })
  @IsArray()
  @IsString({ each: true })
  base: string[];

  @ApiProperty({
    description: 'The type of value a search parameter refers to',
    enum: SearchParameterType,
    example: SearchParameterType.STRING
  })
  @IsEnum(SearchParameterType)
  type: SearchParameterType;

  @ApiPropertyOptional({
    description: 'FHIRPath expression that extracts the values',
    example: 'Patient.name'
  })
  @IsOptional()
  @IsString()
  expression?: string;

  @ApiPropertyOptional({
    description: 'XPath that extracts the values',
    example: 'f:Patient/f:name'
  })
  @IsOptional()
  @IsString()
  xpath?: string;

  @ApiPropertyOptional({
    description: 'How the search parameter relates to the set of elements',
    enum: XPathUsage,
    example: XPathUsage.NORMAL
  })
  @IsOptional()
  @IsEnum(XPathUsage)
  xpathUsage?: XPathUsage;

  @ApiPropertyOptional({
    description: 'Types of resource (if a resource reference)',
    type: [String],
    example: ['Patient', 'Practitioner']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target?: string[];

  @ApiPropertyOptional({
    description: 'Allow multiple values per parameter (or)',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  multipleOr?: boolean;

  @ApiPropertyOptional({
    description: 'Allow multiple parameters (and)',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  multipleAnd?: boolean;

  @ApiPropertyOptional({
    description: 'Comparators supported for the search parameter',
    enum: SearchComparator,
    isArray: true,
    example: ['eq', 'ne', 'gt', 'lt']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SearchComparator, { each: true })
  comparator?: SearchComparator[];

  @ApiPropertyOptional({
    description: 'A modifier supported for the search parameter',
    enum: SearchModifier,
    isArray: true,
    example: ['missing', 'exact', 'contains']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SearchModifier, { each: true })
  modifier?: SearchModifier[];

  @ApiPropertyOptional({
    description: 'Chained names supported',
    type: [String],
    example: ['name', 'address.city']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chain?: string[];

  @ApiPropertyOptional({
    description: 'For Composite resources to define the parts',
    type: [SearchParameterComponentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchParameterComponentDto)
  component?: SearchParameterComponentDto[];

  @ApiPropertyOptional({ description: 'Language of the resource content' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Text summary of the resource' })
  @IsOptional()
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  };

  @ApiPropertyOptional({ description: 'Additional extensions' })
  @IsOptional()
  @IsArray()
  extension?: any[];

  @ApiPropertyOptional({ description: 'Extensions that cannot be ignored' })
  @IsOptional()
  @IsArray()
  modifierExtension?: any[];
}