import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityRepository } from '../../infrastructure/security.repository';
import { DeleteOtherUserSessionsCommand } from './commands/delete-other-user-sessions.command';

@CommandHandler(DeleteOtherUserSessionsCommand)
export class DeleteOtherUserSessionsUseCase
  implements ICommandHandler<DeleteOtherUserSessionsCommand>
{
  constructor(private securityRepository: SecurityRepository) {}

  async execute(command: DeleteOtherUserSessionsCommand): Promise<boolean> {
    return this.securityRepository.deleteOtherUserSessions(command.deviceId);
  }
}
