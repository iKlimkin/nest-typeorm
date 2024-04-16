import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';

export class CreatePairCommand {
  constructor(public readonly createData: UserSessionDto) {}
}
