import {
  loginLength,
  loginMatch,
  passwordLength,
  frequentLength,
  emailMatches,
} from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';

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
