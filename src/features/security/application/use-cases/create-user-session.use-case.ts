import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/output.models';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { CreateSessionCommand } from './commands/create-session.command';
import { SecurityRepository } from '../../infrastructure/security.repository';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { UserSessionRawDto } from '../../../auth/api/models/dtos/user-session.dto';

@CommandHandler(CreateSessionCommand)
export class CreateUserSessionUseCase
  implements ICommandHandler<CreateSessionCommand>
{
  private location = this.constructor.name;
  constructor(private securityRepo: SecurityRepository) {}

  async execute(
    command: CreateSessionCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    try {
      await validateOrRejectModel(command, CreateSessionCommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        this.location,
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    const {
      ipAddress,
      browser,
      deviceType,
      refreshToken,
      userId,
      userPayload,
    } = command.inputData;

    const sessionDto = new UserSessionRawDto(
      ipAddress,
      `Device type: ${deviceType}, Application: ${browser}`,
      userId,
      userPayload,
      refreshToken,
    );

    const result = await this.securityRepo.createSession(sessionDto);
    
    notice.addData({ id: result.id });
    return notice;
  }
}
