import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { UserRecoveryType } from '../../api/models/auth.output.models/auth.output.models';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { PasswordRecoveryCommand } from './commands/recovery-password.command';
import { SendRecoveryMsgCommand } from './commands/send-recovery-msg.command';
import { createRecoveryCode } from '../helpers/create-recovery-message.helper';

@CommandHandler(PasswordRecoveryCommand)
export class RecoveryPasswordUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private commandBus: CommandBus,
    private authRepo: AuthRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<boolean> {
    const recoveryPassInfo: UserRecoveryType = createRecoveryCode();
    const { email } = command.recoveryDto;

    const updateRecoveryCode = await this.authRepo.updateRecoveryCode(
      email,
      recoveryPassInfo,
    );

    if (!updateRecoveryCode) return false;

    const recoveryMsgCommand = new SendRecoveryMsgCommand({
      email,
      recoveryCode: recoveryPassInfo.recoveryCode,
    });

    this.commandBus.execute(recoveryMsgCommand);

    return updateRecoveryCode;
  }
}
