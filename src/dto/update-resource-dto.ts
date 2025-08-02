import { ApiPropertyOptional } from '@nestjs/swagger'
import { FhirMetaCreateDto } from './fhir-meta-create-dto'
import { IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateResourceDto {
  
  @ApiPropertyOptional({
    description: 'Metadata about the resource',
    type: () => FhirMetaCreateDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FhirMetaCreateDto)
  meta?: FhirMetaCreateDto;
  
  @ApiPropertyOptional({
    description: 'A set of rules under which this content was created'
  })
  @IsOptional()
  @IsUrl()
  implicitRules?: string;
  
  @ApiPropertyOptional({
    description: 'Language of the resource content (BCP-47)',
    example: 'en-US'
  })
  @IsOptional()
  @IsString()
  language?: string;
  
  @ApiPropertyOptional({
    description: 'Text summary of the resource, for human interpretation'
  })
  @IsOptional()
  @IsObject()
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  };
  
  @ApiPropertyOptional({
    description: 'Contained, inline Resources',
    type: [Object]
  })
  @IsOptional()
  contained?: any[];
  
  @ApiPropertyOptional({
    description: 'Additional content defined by implementations',
    type: [Object]
  })
  @IsOptional()
  extension?: any[];
  
  @ApiPropertyOptional({
    description: 'Extensions that cannot be ignored',
    type: [Object]
  })
  @IsOptional()
  modifierExtension?: any[];
  
  [key: string]: any;
}
