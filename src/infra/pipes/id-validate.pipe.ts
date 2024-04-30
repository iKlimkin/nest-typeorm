import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ValidateIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const isValidUuid = isUUID(value);

    if (!isValidUuid) {
      throw new BadRequestException('Invalid id');
    }

    return value;
  }
}
