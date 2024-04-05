import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmEmailCommand } from './commands/confirm-email.command';
import { AuthRepository } from '../../infrastructure/auth.repository';

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase
  implements ICommandHandler<ConfirmEmailCommand>
{
  constructor(private authRepo: AuthRepository) {}

  async execute(command: ConfirmEmailCommand): Promise<boolean> {
    const { code } = command.confirmDto;

    const user = await this.authRepo.findUserAccountByConfirmationCode(code);

    if (!user || user.is_confirmed) return false;

    return this.authRepo.updateConfirmation(user.id);
  }
}
