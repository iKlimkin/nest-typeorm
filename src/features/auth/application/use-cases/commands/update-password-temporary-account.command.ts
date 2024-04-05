import { RecoveryPassDto } from '../../../api/models/auth-input.models.ts/recovery.model';

export class UpdatePassTempAccountCommand {
  constructor(public updateDto: RecoveryPassDto) {}
}
