import { RecoveryPassDto } from '../../../api/models/auth-input.models.ts/input-recovery.model';

export class UpdatePassTempAccountCommand {
  constructor(public updateDto: RecoveryPassDto) {}
}
