import { RegistrationEmailDto } from '../../../api/models/auth-input.models.ts/input-password-rec.type';

export class PasswordRecoveryCommand {
  constructor(public recoveryDto: RegistrationEmailDto) {}
}
