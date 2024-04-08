import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateUserErrors,
  GetErrors,
} from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { CreateSACommand } from '../commands/create-sa.command';
import { UserIdType } from '../../api/models/outputSA.models.ts/user-models';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt-adapter';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../infrastructure/users.repo';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateSACommand)
export class CreateSAUseCase implements ICommandHandler<CreateSACommand> {
  constructor(
    private bcryptAdapter: BcryptAdapter,
    private usersRepo: UsersRepository,
  ) {}

  async execute(
    command: CreateSACommand,
  ): Promise<LayerNoticeInterceptor<UserIdType>> {
    let notice = new LayerNoticeInterceptor<UserIdType>();
    
    try {
      await validateOrRejectModel(command, CreateSACommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        'input',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    const { email, login, password } = command.createData;

    const { passwordSalt, passwordHash } =
      await this.bcryptAdapter.createHash(password);

    const saDto = {
      login,
      email,
      password_salt: passwordSalt,
      password_hash: passwordHash,
      confirmation_code: uuidv4(),
      confirmation_expiration_date: add(new Date(), { hours: 1, minutes: 15 }),
      is_confirmed: true,
    };

    const userAdminId = await this.usersRepo.createUser(saDto);

    if (!userAdminId) {
      notice.addError(
        'Could not create sa',
        'db',
        CreateUserErrors.DatabaseFail,
      );
    } else {
      notice.addData({ userId: userAdminId.userId });
    }

    return notice;
  }
}
