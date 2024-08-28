import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';
import {
  frequentLength,
  passwordLength,
} from '../../../../../domain/validation.constants';
import { IsString } from 'class-validator';

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

export class UserCredentialsWithCaptureTokenDto extends UserCredentialsDto {
  @IsString()
  recaptureToken: string;
}
