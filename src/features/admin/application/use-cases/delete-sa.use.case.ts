import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepo } from '../../infrastructure/users.repo';
import { DeleteSACommand } from '../commands/delete-sa.command';


@CommandHandler(DeleteSACommand)
export class DeleteSAUseCase implements ICommandHandler<DeleteSACommand> {
  constructor(
    private usersRepo: UsersRepo,
  ) {}
  async execute(command: DeleteSACommand): Promise<boolean> {
    return this.usersRepo.deleteUser(command.userId);
  }
}
