import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityRepository } from '../../infrastructure/security.repository';
import { DeleteActiveSessionCommand } from './commands/delete-active-session.command';

@CommandHandler(DeleteActiveSessionCommand)
export class DeleteActiveSessionUseCase
  implements ICommandHandler<DeleteActiveSessionCommand>
{
  constructor(private securityRepo: SecurityRepository) {}

  async execute(command: DeleteActiveSessionCommand): Promise<boolean> {
    return this.securityRepo.deleteSpecificSession(command.deviceId);
  }
}
