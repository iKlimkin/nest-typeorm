import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SecurityRepository } from '../../infrastructure/security.repository';
import { DeleteOtherUserSessionsCommand } from './commands/delete-other-user-sessions.command';

@CommandHandler(DeleteOtherUserSessionsCommand)
export class DeleteOtherUserSessionsUseCase
  implements ICommandHandler<DeleteOtherUserSessionsCommand>
{
  constructor(private securityRepo: SecurityRepository) {}

  async execute(command: DeleteOtherUserSessionsCommand): Promise<boolean> {
    return this.securityRepo.deleteOtherUserSessions(command.deviceId);
  }
}
