import { RecoveryPassDto } from '../../../api/models/auth-input.models.ts/input-recovery.model';

export class UpdatePasswordCommand {
  constructor(public updateDto: RecoveryPassDto) {}
}
