import { RegistrationCodeDto } from '../../../api/models/auth-input.models.ts/registration-code.model';

export class ConfirmEmailCommand {
  constructor(public confirmDto: RegistrationCodeDto) {}
}
