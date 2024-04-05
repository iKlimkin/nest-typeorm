import { RecoveryPassDto } from '../../../api/models/auth-input.models.ts/recovery.model';

export class UpdatePasswordCommand {
  constructor(public updateDto: RecoveryPassDto) {}
}
