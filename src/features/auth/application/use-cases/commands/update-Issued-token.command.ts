import { DeviceInfoDto } from '../../../../security/api/models/security-input.models/security-session-info.model';

export class UpdateIssuedTokenCommand {
  constructor(public readonly updateData: DeviceInfoDto) {}
}
