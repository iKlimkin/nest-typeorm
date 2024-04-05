import { Matches } from 'class-validator';
import { emailMatches } from '../../../../../domain/validation.constants';

export type PasswordRecoveryType = {
  newPassword: string;
  recoveryCode: string;
};

export type SendRecoveryMsgType = { email: string; recoveryCode: string };

export class RegistrationEmailDto {
  /**
   * email of account
   */
  @Matches(emailMatches)
  email: string;
}
