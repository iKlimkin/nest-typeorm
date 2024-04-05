import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityRepository } from '../../../security/infrastructure/security.repository';
import { UpdateIssuedTokenCommand } from './commands/update-Issued-token.command';

@CommandHandler(UpdateIssuedTokenCommand)
export class UpdateIssuedTokenUseCase
  implements ICommandHandler<UpdateIssuedTokenCommand>
{
  constructor(private securityRepo: SecurityRepository) {}

  async execute(command: UpdateIssuedTokenCommand): Promise<boolean> {
    return this.securityRepo.updateIssuedToken(
      command.updateData.deviceId,
      command.updateData.issuedAt,
      command.updateData.expirationDate,
    );
  }
}
