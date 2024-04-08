import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt-adapter';
import {
  CreateUserErrors,
  GetErrors,
} from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { UsersSQLDto } from '../../api/models/auth.output.models/auth-raw.output.models';
import { CreateUserCommand } from './commands/create-user.command';
import { EmailNotificationEvent } from './events/email-notification-event';
import { UserIdType } from '../../../admin/api/models/outputSA.models.ts/user-models';

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

    const { passwordSalt, passwordHash } =
      await this.bcryptAdapter.createHash(password);

    const userDto: UsersSQLDto = {
      login,
      email,
      password_salt: passwordSalt,
      password_hash: passwordHash,
      confirmation_code: uuidv4(),
      confirmation_expiration_date: add(new Date(), {
        hours: 1,
        minutes: 15,
      }),
      is_confirmed: false,
    };

    const result = await this.usersRepo.createUser(userDto);

    if (!result) {
      notice.addError(
        'Could not create user',
        'db',
        CreateUserErrors.DatabaseFail,
      );
    } else {
      notice.addData({ userId: result.userId });
    }

    const event = new EmailNotificationEvent(email, userDto.confirmation_code);

    this.eventBus.publish(event);

    return notice;
  }
}
