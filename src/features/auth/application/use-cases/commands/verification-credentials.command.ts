import { UserCredentialsDto } from '../../../api/models/auth-input.models.ts/input-credentials.model';

export class VerificationCredentialsCommand {
  constructor(public verificationDto: UserCredentialsDto) {}
}
