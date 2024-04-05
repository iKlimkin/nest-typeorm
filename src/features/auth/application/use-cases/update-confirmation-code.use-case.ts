import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { UpdateConfirmationCodeCommand } from './commands/update-confirmation-code.command';
import { EmailNotificationEvent } from './events/email-notification-event';
import { createRecoveryCode } from '../helpers/create-recovery-message.helper';

@CommandHandler(UpdateConfirmationCodeCommand)
export class UpdateConfirmationCodeUseCase
  implements ICommandHandler<UpdateConfirmationCodeCommand>
{
  constructor(
    private authRepo: AuthRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: UpdateConfirmationCodeCommand): Promise<boolean> {
    const { expirationDate, recoveryCode } = createRecoveryCode();
    const { email } = command.updateDto;

    const updatedCode = await this.authRepo.updateConfirmationCode(
      email,
      recoveryCode,
      expirationDate,
    );

    const event = new EmailNotificationEvent(email, recoveryCode);

    this.eventBus.publish(event);

    return updatedCode;
  }
}
