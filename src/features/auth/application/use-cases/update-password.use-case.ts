import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt.adapter';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UpdatePasswordCommand } from './commands/update-password.command';
import { AuthRepository } from '../../infrastructure/auth.repository';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase
  implements ICommandHandler<UpdatePasswordCommand>
{
  constructor(
    private authRepo: AuthRepository,
    private bcryptAdapter: BcryptAdapter,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<boolean> {
    try {
      await validateOrRejectModel(command, UpdatePasswordCommand);

      const { recoveryCode, newPassword } = command.updateDto;

      const { passwordHash, passwordSalt } =
        await this.bcryptAdapter.createHash(newPassword);

      return this.authRepo.updateUserPassword({
        passwordSalt,
        passwordHash,
        recoveryCode,
      });
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
