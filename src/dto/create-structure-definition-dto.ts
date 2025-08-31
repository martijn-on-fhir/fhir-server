import {ApiProperty} from '@nestjs/swagger';
import {IsObject, IsString} from 'class-validator';

export class CreateStructureDefinitionDto {

    @ApiProperty({
        description: 'Resource type',
        example: 'StructureDefinition',
        default: 'StructureDefinition'
    })
    @IsString()
    resourceType: string = 'StructureDefinition';

    @ApiProperty({
        description: 'Canonical identifier for this structure definition',
        example: 'http://hl7.org/fhir/StructureDefinition/Patient'
    })
    @IsString()
    url: string;

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