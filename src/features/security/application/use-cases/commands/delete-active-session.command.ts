import { UserSessionDto } from '../../../api/models/security-input.models/security-session-info.model';

export class DeleteActiveSessionCommand {
  constructor(public deleteData: UserSessionDto) {}
}
