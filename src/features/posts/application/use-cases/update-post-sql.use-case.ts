import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { PostsSqlRepository } from '../../infrastructure/posts.sql-repository';
import { UpdatePostSqlCommand } from './commands/update-post-sql.command';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { PostsTorRepo } from '../../infrastructure/posts.typeorm-repository';

@CommandHandler(UpdatePostSqlCommand)
export class UpdatePostSqlUseCase
  implements ICommandHandler<UpdatePostSqlCommand>
{
  constructor(
    private postsSqlRepository: PostsSqlRepository,
    private postsRepo: PostsTorRepo,
  ) {}

  async execute(
    command: UpdatePostSqlCommand,
  ): Promise<LayerNoticeInterceptor | void> {
    const notice = new LayerNoticeInterceptor();
    try {
      await validateOrRejectModel(command, UpdatePostSqlCommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        'model',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    await this.postsRepo.updatePost(command.updatePostDto);
  }
}
