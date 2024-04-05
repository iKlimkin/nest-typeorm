import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UpdatePassTempAccountCommand } from './commands/update-password-temporary-account.command';
import { CreateUserAccountEvent } from './events/create-user-account-event';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';

@CommandHandler(UpdatePassTempAccountCommand)
export class UpdatePasswordTemporaryAccountUseCase
  implements ICommandHandler<UpdatePassTempAccountCommand>
{
  constructor(
    private authRepo: AuthRepository,
    private eventBus: EventBus,
  ) {}

  async execute(
    command: UpdatePassTempAccountCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const notice = new LayerNoticeInterceptor<boolean>();
    try {
      await validateOrRejectModel(command, UpdatePassTempAccountCommand);
    } catch (error) {
      notice.addError(
        'incorrect model',
        'validateOrRejectModel',
        GetErrors.IncorrectModel,
      );
      return notice;
    }
    const { recoveryCode, newPassword } = command.updateDto;

    const temporaryUserAccount =
      await this.authRepo.findTemporaryAccountByRecoveryCode(recoveryCode);

    if (!temporaryUserAccount) {
      notice.addError(
        'temporaryUserAccount not found',
        'findTemporaryAccountByRecoveryCode',
        GetErrors.NotFound,
      );
      return notice;
    }

    const uniqueLogin = uuidv4();

    const event = new CreateUserAccountEvent({
      email: temporaryUserAccount.email,
      login: uniqueLogin,
      password: newPassword,
    });

    await this.eventBus.publish(event);

    const result = await this.authRepo.deleteTemporaryUserAccount(recoveryCode);

    if (!result) {
      notice.addError(
        "couldn't delete temp account",
        'deleteTemporaryUserAccount',
        GetErrors.NotFound,
      );
    } else {
      notice.addData(result);
      return notice;
    }
  }
}
