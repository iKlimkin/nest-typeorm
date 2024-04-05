import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-string';
import {
  loginLength,
  loginMatch,
  passwordLength,
  frequentLength,
  emailMatches,
} from '../../../../../domain/validation.constants';

export class CreateUserDto {
  /**
   * login of the registered user account
   */
  @iSValidField(loginLength, loginMatch)
  login: string;

  /**
   * password of the registered user account.
   */
  @iSValidField(passwordLength)
  password: string;

  /**
   * email of the registered user account.
   */
  @iSValidField(frequentLength, emailMatches)
  email: string;
}
