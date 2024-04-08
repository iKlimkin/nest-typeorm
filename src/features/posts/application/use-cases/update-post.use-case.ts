import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { UpdatePostCommand } from './commands/update-post.command';

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(private postsRepo: PostsRepository) {}

  async execute(
    command: UpdatePostCommand,
  ): Promise<LayerNoticeInterceptor | void> {
    const notice = new LayerNoticeInterceptor();
    try {
      await validateOrRejectModel(command, UpdatePostCommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        'model',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    await this.postsRepo.updatePost(command.updateData);
  }
}
