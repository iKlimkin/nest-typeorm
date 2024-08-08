import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt.adapter';
import {
  CreateUserErrors,
  GetErrors,
} from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UserIdType } from '../../../admin/api/models/outputSA.models.ts/user-models';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { CreateUserCommand } from './commands/create-user.command';
import { EmailNotificationEvent } from './events/email-notification-event';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private usersRepo: UsersRepository,
    private bcryptAdapter: BcryptAdapter,
    private eventBus: EventBus,
  ) {}

  async execute(
    command: CreateUserCommand,
  ): Promise<LayerNoticeInterceptor<UserIdType> | null> {
    const { email, login, password } = command.createDto;

    const notice = new LayerNoticeInterceptor<UserIdType>();

    try {
      await validateOrRejectModel(command, CreateUserCommand);
    } catch (error) {
      notice.addError(
        'invalid model',
        'CreateUserUseCase',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    const { passwordSalt, passwordHash } = await this.bcryptAdapter.createHash(
      password,
    );

    const userDto = {
      login,
      email,
      passwordSalt,
      passwordHash,
      isConfirmed: false,
    };

    const user = UserAccount.create(userDto);

    const result = await this.usersRepo.save(user);

    if (!result) {
      notice.addError(
        'Could not create user',
        'db',
        CreateUserErrors.DatabaseFail,
      );
    } else {
      notice.addData({ userId: result.userId });
    }

    const event = new EmailNotificationEvent(email, user.confirmation_code);

    this.eventBus.publish(event);

    return notice;
  }
}
