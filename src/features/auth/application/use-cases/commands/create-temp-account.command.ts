import { RegistrationEmailDto } from '../../../api/models/auth-input.models.ts/input-password-rec.type';

export class CreateTemporaryAccountCommand {
  constructor(public createDto: RegistrationEmailDto) {}
}
