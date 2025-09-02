import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsArray, IsBoolean, IsDateString, IsEnum, IsObject, IsOptional, IsString} from 'class-validator';

export class CreateStructureDefinitionDto {

    @ApiProperty({
        description: 'Resource type',
        example: 'StructureDefinition',
        default: 'StructureDefinition'
    })
    @IsString()
    resourceType: string = 'StructureDefinition';

    @ApiPropertyOptional({
        description: 'Logical id of this artifact'
    })
    @IsOptional()
    @IsString()
    id?: string;

    @ApiPropertyOptional({
        description: 'Metadata about the resource'
    })
    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'A set of rules under which this content was created'
    })
    @IsOptional()
    @IsString()
    implicitRules?: string;

    @ApiPropertyOptional({
        description: 'Language of the resource content'
    })
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional({
        description: 'Text summary of the resource, for human interpretation'
    })
    @IsOptional()
    @IsObject()
    text?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Contained, inline Resources'
    })
    @IsOptional()
    @IsArray()
    contained?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Additional content defined by implementations'
    })
    @IsOptional()
    @IsArray()
    extension?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Extensions that cannot be ignored'
    })
    @IsOptional()
    @IsArray()
    modifierExtension?: Record<string, any>[];

    @ApiProperty({
        description: 'Canonical identifier for this structure definition, represented as a URI (globally unique)',
        example: 'http://hl7.org/fhir/StructureDefinition/Patient'
    })
    @IsString()
    url: string;

    @ApiPropertyOptional({
        description: 'Additional identifier for the structure definition'
    })
    @IsOptional()
    @IsArray()
    identifier?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Business version of the structure definition'
    })
    @IsOptional()
    @IsString()
    version?: string;

    @ApiProperty({
        description: 'Name for this structure definition (computer friendly)',
        example: 'Patient'
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Name for this structure definition (human friendly)'
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({
        description: 'The status of this structure definition',
        enum: ['draft', 'active', 'retired', 'unknown'],
        example: 'active'
    })
    @IsEnum(['draft', 'active', 'retired', 'unknown'])
    status: string;

    @ApiPropertyOptional({
        description: 'For testing purposes, not real usage'
    })
    @IsOptional()
    @IsBoolean()
    experimental?: boolean;

    @ApiPropertyOptional({
        description: 'Date last changed'
    })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({
        description: 'Name of the publisher (organization or individual)'
    })
    @IsOptional()
    @IsString()
    publisher?: string;

    @ApiPropertyOptional({
        description: 'Contact details for the publisher'
    })
    @IsOptional()
    @IsArray()
    contact?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Natural language description of the structure definition'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'The context that the content is intended to support'
    })
    @IsOptional()
    @IsArray()
    useContext?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Intended jurisdiction for structure definition (if applicable)'
    })
    @IsOptional()
    @IsArray()
    jurisdiction?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'Why this structure definition is defined'
    })
    @IsOptional()
    @IsString()
    purpose?: string;

    @ApiPropertyOptional({
        description: 'Use and/or publishing restrictions'
    })
    @IsOptional()
    @IsString()
    copyright?: string;

    @ApiPropertyOptional({
        description: 'Assist with indexing and finding'
    })
    @IsOptional()
    @IsArray()
    keyword?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'FHIR Version this StructureDefinition targets'
    })
    @IsOptional()
    @IsString()
    fhirVersion?: string;

    @ApiPropertyOptional({
        description: 'External specification that the content is mapped to'
    })
    @IsOptional()
    @IsArray()
    mapping?: Record<string, any>[];

    @ApiProperty({
        description: 'The type of structure being defined',
        enum: ['primitive-type', 'complex-type', 'resource', 'logical'],
        example: 'resource'
    })
    @IsEnum(['primitive-type', 'complex-type', 'resource', 'logical'])
    kind: string;

    @ApiProperty({
        description: 'Whether the structure is abstract',
        example: false
    })
    @IsBoolean()
    abstract: boolean;

    @ApiPropertyOptional({
        description: 'If an extension, where it can be used in instances'
    })
    @IsOptional()
    @IsArray()
    context?: Record<string, any>[];

    @ApiPropertyOptional({
        description: 'FHIRPath invariants - when the extension can be used'
    })
    @IsOptional()
    @IsArray()
    contextInvariant?: string[];

    @ApiProperty({
        description: 'Type defined or constrained by this structure',
        example: 'Patient'
    })
    @IsString()
    type: string;

    @ApiPropertyOptional({
        description: 'Definition that this type is constrained/specialized from'
    })
    @IsOptional()
    @IsString()
    baseDefinition?: string;

    @ApiPropertyOptional({
        description: 'specialization | constraint - How relates to base definition',
        enum: ['specialization', 'constraint']
    })
    @IsOptional()
    @IsEnum(['specialization', 'constraint'])
    derivation?: string;

    @ApiPropertyOptional({
        description: 'Snapshot view of the structure'
    })
    @IsOptional()
    @IsObject()
    snapshot?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Differential view of the structure'
    })
    @IsOptional()
    @IsObject()
    differential?: Record<string, any>;

    @ApiProperty({
        description: 'FHIR version release number',
        example: 4,
        default: 4
    })
    release: number = 4;

    @ApiProperty({
        description: 'Structure definition content',
        type: Object,
        example: {
            "kind": "resource",
            "abstract": false,
            "type": "Patient",
            "baseDefinition": "http://hl7.org/fhir/StructureDefinition/DomainResource"
        }
    })
    @IsObject()
    definition: Record<string, any>;
}