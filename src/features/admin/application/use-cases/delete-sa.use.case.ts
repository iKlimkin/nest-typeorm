import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersSQLRepository } from '../../infrastructure/users.sql-repository';
import { DeleteSACommand } from '../commands/delete-sa.command';
import { UserAccountsTORRepo } from '../../infrastructure/users.repo';

@CommandHandler(DeleteSACommand)
export class DeleteSAUseCase implements ICommandHandler<DeleteSACommand> {
  constructor(
    private usersSQLRepository: UsersSQLRepository,
    private userAccountsRepo: UserAccountsTORRepo,
  ) {}
  async execute(command: DeleteSACommand): Promise<boolean> {
    return this.userAccountsRepo.deleteUser(command.userId);
  }
}
