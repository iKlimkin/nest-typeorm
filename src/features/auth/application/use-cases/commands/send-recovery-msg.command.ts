import { SendRecoveryMsgType } from '../../../api/models/auth-input.models.ts/password-recovery.types';

export class SendRecoveryMsgCommand {
  constructor(public recoveryDto: SendRecoveryMsgType) {}
}
