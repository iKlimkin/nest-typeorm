import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';

export class ConnectPlayerCommand {
  constructor(public readonly connectionData: UserSessionDto) {}
}
