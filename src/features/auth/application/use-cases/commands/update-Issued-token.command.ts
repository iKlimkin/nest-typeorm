import { DeviceInfoDto } from '../../../api/models/auth-input.models.ts/security-user-session-info';

export class UpdateIssuedTokenCommand {
  constructor(public readonly updateData: DeviceInfoDto) {}
}
