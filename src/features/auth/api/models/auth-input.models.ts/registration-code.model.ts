import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-string';
import { frequentLength } from '../../../../../domain/validation.constants';

export class RegistrationCodeDto {
  @iSValidField(frequentLength)
  code: string;
}
