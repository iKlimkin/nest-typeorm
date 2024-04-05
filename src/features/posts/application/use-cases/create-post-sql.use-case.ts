import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { BlogsSqlRepository } from '../../../blogs/infrastructure/blogs.sql-repository';
import { PostDtoSqlModel } from '../../api/models/post-sql.model';
import { PostsSqlRepository } from '../../infrastructure/posts.sql-repository';
import { CreatePostSqlCommand } from './commands/create-post-sql.command';
import { BlogsTORRepo } from '../../../blogs/infrastructure/blogs.typeorm-repository';
import { PostsTorRepo } from '../../infrastructure/posts.typeorm-repository';

@CommandHandler(CreatePostSqlCommand)
export class CreatePostSqlUseCase
  implements ICommandHandler<CreatePostSqlCommand>
{
  constructor(
    private postsSqlRepository: PostsSqlRepository,
    private postsRepo: PostsTorRepo,
    private blogsSqlRepository: BlogsSqlRepository,
    private blogsRepo: BlogsTORRepo,
  ) {}

  async execute(
    command: CreatePostSqlCommand,
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId>();

    try {
      await validateOrRejectModel(command, CreatePostSqlCommand);
    } catch (error) {
      notice.addError(
        'Input data incorrect',
        'input',
        GetErrors.IncorrectModel,
      );
      return notice;
    }

    const { title, shortDescription, content, blogId, blogTitle } =
      command.createDataDto;

    const postDto = new PostDtoSqlModel({
      title,
      short_description: shortDescription,
      content,
      blog_id: blogId,
      blog_title: blogTitle,
    });

    const result = await this.postsRepo.createPost(postDto);

    if (result) {
      notice.addData(result);
    } else {
      notice.addError('Post not created', 'db', GetErrors.DatabaseFail);
    }

    return notice;
  }
}
