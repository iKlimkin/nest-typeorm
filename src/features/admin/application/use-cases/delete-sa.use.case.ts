import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repo';
import { DeleteSACommand } from '../commands/delete-sa.command';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { DataSource } from 'typeorm';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@CommandHandler(DeleteSACommand)
export class DeleteSAUseCase implements ICommandHandler<DeleteSACommand> {
  constructor(
    private usersRepo: UsersRepository,
    private dataSource: DataSource,
  ) {}
  async execute(
    command: DeleteSACommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<boolean>();

      const result = await this.usersRepo.deleteUser(command.userId, manager);

      if (!result) {
        notice.addError(
          'User not found',
          this.constructor.name,
          GetErrors.NotFound,
        );
      }
      return notice;
    });
  }
}
