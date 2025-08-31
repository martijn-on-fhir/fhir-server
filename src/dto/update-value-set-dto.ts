import { PartialType } from '@nestjs/swagger';
import { CreateValueSetDto } from './create-value-set-dto';

export class UpdateValueSetDto extends PartialType(CreateValueSetDto) {}