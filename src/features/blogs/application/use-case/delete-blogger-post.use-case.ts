import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { DeleteBloggerPostCommand } from './commands/delete-blogger-blog.command';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { BlogService } from '../blog.service';

@CommandHandler(DeleteBloggerPostCommand)
export class DeleteBloggerPostUseCase
  implements ICommandHandler<DeleteBloggerPostCommand>
{
  private readonly location: string;
  constructor(
    private postsRepo: PostsRepository,
    private dataSource: DataSource,
    private blogService: BlogService,
  ) {
    this.location = 'BlogsController';
  }

  async execute(
    command: DeleteBloggerPostCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const { userId, blogId, postId } = command.data;
    const { location, dataSource, blogService, postsRepo } = this;

    return runInTransaction(dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<boolean>();

      const blogServiceNotice = await blogService.validateBlogAndUserRights(
        blogId,
        userId,
        postId,
      );

      if (blogServiceNotice.hasError)
        return blogServiceNotice as LayerNoticeInterceptor;

      const result = await postsRepo.deletePost(postId);

      if (!result) {
        notice.addError(`Couldn't delete post`, location, GetErrors.NotFound);
      }

      return notice;
    });
  }
}
