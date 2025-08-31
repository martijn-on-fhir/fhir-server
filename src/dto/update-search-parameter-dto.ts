import { PartialType } from '@nestjs/swagger';
import { CreateSearchParameterDto } from './create-search-parameter-dto';

export class UpdateSearchParameterDto extends PartialType(CreateSearchParameterDto) {}