import { PartialType } from '@nestjs/mapped-types';
import { CreateTgDto } from './create-tg.dto';

export class UpdateTgDto extends PartialType(CreateTgDto) {}
