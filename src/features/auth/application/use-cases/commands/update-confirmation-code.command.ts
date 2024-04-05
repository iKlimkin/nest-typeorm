import { RegistrationEmailDto } from '../../../api/models/auth-input.models.ts/input-password-rec.type';

export class UpdateConfirmationCodeCommand {
  constructor(public updateDto: RegistrationEmailDto) {}
}
