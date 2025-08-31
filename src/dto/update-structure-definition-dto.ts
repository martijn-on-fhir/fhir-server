import { PartialType } from '@nestjs/swagger';
import { CreateStructureDefinitionDto } from './create-structure-definition-dto';

export class UpdateStructureDefinitionDto extends PartialType(CreateStructureDefinitionDto) {}