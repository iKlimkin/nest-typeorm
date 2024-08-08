import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt.adapter';
import {
  CreateUserErrors,
  GetErrors,
} from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { ResponseIdType } from '../../api/models/outputSA.models.ts/user-models';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { UsersRepository } from '../../infrastructure/users.repo';
import { CreateSACommand } from '../commands/create-sa.command';

@CommandHandler(CreateSACommand)
export class CreateSAUseCase implements ICommandHandler<CreateSACommand> {
  constructor(
    private bcryptAdapter: BcryptAdapter,
    private usersRepo: UsersRepository,
  ) {}

  async execute(
    command: CreateSACommand,
  ): Promise<LayerNoticeInterceptor<ResponseIdType>> {
    let notice = new LayerNoticeInterceptor<ResponseIdType>();

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

    const { passwordSalt, passwordHash } = await this.bcryptAdapter.createHash(
      password,
    );

    const saDto = {
      login,
      email,
      passwordSalt,
      passwordHash,
      isConfirmed: true,
    };

    const user = UserAccount.create(saDto);

    const userAdmin = await this.usersRepo.save(user);

    if (!userAdmin) {
      notice.addError(
        'Could not create sa',
        'db',
        CreateUserErrors.DatabaseFail,
      );
    } else {
      notice.addData({ id: userAdmin.userId });
    }

    return notice;
  }
}
