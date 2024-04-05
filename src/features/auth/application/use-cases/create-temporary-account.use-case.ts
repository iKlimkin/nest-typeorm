import { OutputId } from '../../../../domain/likes.types';
import { UserRecoveryType } from '../../api/models/auth.output.models/auth.output.models';
import { CreateTemporaryAccountCommand } from './commands/create-temp-account.command';
import { SendRecoveryMsgCommand } from './commands/send-recovery-msg.command';
import { createRecoveryCode } from '../helpers/create-recovery-message.helper';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';

@CommandHandler(CreateTemporaryAccountCommand)
export class CreateTemporaryAccountUseCase
  implements ICommandHandler<CreateTemporaryAccountCommand>
{
  constructor(
    private authRepo: AuthRepository,
    private commandBus: CommandBus,
  ) {}

  async execute(command: CreateTemporaryAccountCommand): Promise<OutputId> {
    const { email } = command.createDto;
    const recoveryPassInfo: UserRecoveryType = createRecoveryCode();

    const tempAccountDto = {
      email,
      recoveryCode: recoveryPassInfo.recoveryCode,
      expirationDate: recoveryPassInfo.expirationDate,
    };

    const temporaryUserAccount =
      await this.authRepo.createTemporaryUserAccount(tempAccountDto);

    const sendRecoveryMsgCommand = new SendRecoveryMsgCommand({
      email,
      recoveryCode: recoveryPassInfo.recoveryCode,
    });

    this.commandBus.execute(sendRecoveryMsgCommand);

    return temporaryUserAccount!;
  }
}
