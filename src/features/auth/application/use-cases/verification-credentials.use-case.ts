import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt-adapter';
import { UserIdType } from '../../../admin/api/models/outputSA.models.ts/user-models';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { VerificationCredentialsCommand } from './commands/verification-credentials.command';

@CommandHandler(VerificationCredentialsCommand)
export class VerificationCredentialsUseCase
  implements ICommandHandler<VerificationCredentialsCommand>
{
  constructor(
    private authRepo: AuthRepository,
    private bcryptAdapter: BcryptAdapter,
  ) {}

  async execute(
    command: VerificationCredentialsCommand,
  ): Promise<LayerNoticeInterceptor<UserIdType | null>> {
    const notice = new LayerNoticeInterceptor<UserIdType>();
    try {
      await validateOrRejectModel(command, VerificationCredentialsCommand);
    } catch (error) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return;
    }

    const userAccount = await this.authRepo.findByLoginOrEmail({
      loginOrEmail: command.verificationDto.loginOrEmail,
    });

    if (!userAccount) {
      notice.addError('User not found', 'db', GetErrors.NotFound);
      return notice;
    }

    const validPassword = await this.bcryptAdapter.compareAsync(
      command.verificationDto.password,
      userAccount.password_hash,
    );

    if (validPassword) {
      notice.addData({ userId: userAccount.id });
    } else {
      notice.addError('Incorrect password', 'db', GetErrors.IncorrectPassword);
    }

    return notice;
  }
}
