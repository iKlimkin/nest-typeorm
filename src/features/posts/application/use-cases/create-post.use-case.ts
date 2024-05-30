import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/output.models';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { PostCreationDto } from '../../api/models/dto/post-sql.model';
import { CreatePostCommand } from './commands/create-post.command';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(private postsRepo: PostsRepository) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId>();

    try {
      await validateOrRejectModel(command, CreatePostCommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        'CreatePostUseCase',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    const { createPostData } = command;

    const postDto = new PostCreationDto(createPostData);

    const result = await this.postsRepo.createPost(postDto);

    if (result) {
      notice.addData(result);
    } else {
      notice.addError('Post not created', 'db', GetErrors.DatabaseFail);
    }

    return notice;
  }
}
