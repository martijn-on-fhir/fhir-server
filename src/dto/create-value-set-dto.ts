import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateValueSetDto {
  
  @ApiProperty({
    description: 'Canonical identifier for this value set',
    example: 'http://hl7.org/fhir/ValueSet/administrative-gender'
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Resource type',
    example: 'ValueSet',
    default: 'ValueSet'
  })
  @IsOptional()
  @IsString()
  resourceType?: string = 'ValueSet';

  @ApiProperty({
    description: 'Value set expansion with concepts',
    type: Array,
    example: [
      {
        "system": "http://hl7.org/fhir/administrative-gender",
        "code": "male",
        "display": "Male"
      },
      {
        "system": "http://hl7.org/fhir/administrative-gender",
        "code": "female",
        "display": "Female"
      }
    ]
  })
  @IsArray()
  expansion: Record<string, any>[];

  @ApiProperty({
    description: 'Value set definition and metadata',
    type: Object,
    example: {
      "resourceType": "ValueSet",
      "id": "administrative-gender",
      "url": "http://hl7.org/fhir/ValueSet/administrative-gender",
      "name": "AdministrativeGender",
      "title": "Administrative Gender",
      "status": "active",
      "description": "The gender of a person used for administrative purposes"
    }
  })
  @IsObject()
  value: Record<string, any>;
}