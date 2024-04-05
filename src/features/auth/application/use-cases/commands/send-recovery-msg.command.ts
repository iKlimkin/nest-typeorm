import { SendRecoveryMsgType } from '../../../api/models/auth-input.models.ts/input-password-rec.type';

export class SendRecoveryMsgCommand {
  constructor(public recoveryDto: SendRecoveryMsgType) {}
}
