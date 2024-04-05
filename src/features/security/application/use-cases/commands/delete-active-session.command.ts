import { UserSessionDto } from "../../../../auth/api/models/auth-input.models.ts/security-user-session-info";

export class DeleteActiveSessionCommand {
  constructor(public deleteData: UserSessionDto) {}
}
