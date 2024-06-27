import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';
import { frequentLength } from '../../../../../domain/validation.constants';

export class RegistrationCodeDto {
  @iSValidField(frequentLength)
  code: string;
}
