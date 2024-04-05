import { RegistrationEmailDto } from '../../../api/models/auth-input.models.ts/password-recovery.types';

export class PasswordRecoveryCommand {
  constructor(public recoveryDto: RegistrationEmailDto) {}
}
