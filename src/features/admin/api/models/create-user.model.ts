import { iSValidField } from '../../../../infra/decorators/transform/transform-params';
import {
  emailMatches,
  frequentLength,
  loginLength,
  loginMatch,
  passwordLength,
} from '../../../../domain/validation.constants';

export class CreateUserDto {
  /**
   * user's login
   */
  @iSValidField(loginLength, loginMatch)
  login: string;

  /**
   * user's registration password
   */
  @iSValidField(passwordLength)
  password: string;

  /**
   * user's registration email
   */
  @iSValidField(frequentLength, emailMatches)
  email: string;
}
