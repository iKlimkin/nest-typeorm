import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-field';
import {
  frequentLength,
  passwordLength,
} from '../../../../../domain/validation.constants';

export class UserCredentialsDto {
  /**
   * loginOrEmail of the user account
   */
  @iSValidField(frequentLength)
  loginOrEmail: string;

  /**
   * password of the user account.
   */
  @iSValidField(passwordLength)
  password: string;
}
