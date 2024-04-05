import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecuritySqlRepository } from '../../infrastructure/security.sql-repository';
import { DeleteOtherUserSessionsSqlCommand } from './commands/delete-other-user-sessions-sql.command';
import { SecurityTORRepository } from '../../infrastructure/security.repository';

@CommandHandler(DeleteOtherUserSessionsSqlCommand)
export class DeleteOtherUserSessionsSqlUseCase
  implements ICommandHandler<DeleteOtherUserSessionsSqlCommand>
{
  constructor(
    private securitySqlRepository: SecuritySqlRepository,
    private securityRepo: SecurityTORRepository,
  ) {}

  async execute(command: DeleteOtherUserSessionsSqlCommand): Promise<boolean> {
    return this.securityRepo.deleteOtherUserSessions(command.deviceId);
  }
}
