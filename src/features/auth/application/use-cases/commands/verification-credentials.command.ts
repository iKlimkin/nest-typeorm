import { UserCredentialsDto } from '../../../api/models/auth-input.models.ts/verify-credentials.model';

export class VerificationCredentialsCommand {
  constructor(public verificationDto: UserCredentialsDto) {}
}
