import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-field';
import {
  passwordLength,
  frequentLength,
} from '../../../../../domain/validation.constants';

export class RecoveryPassDto {
  /**
   * newPassword of the user account
   */
  @iSValidField(passwordLength)
  newPassword: string;

  /**
   * recoveryCode of the user account.
   */
  @iSValidField(frequentLength)
  recoveryCode: string;
}
