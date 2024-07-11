import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { PostsRepository } from '../../../../settings';
import { BlogService } from '../blog.service';
import { UpdateBloggerPostCommand } from './commands/blogger-update-post.command';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';

@CommandHandler(UpdateBloggerPostCommand)
export class UpdateBloggerPostUseCase
  implements ICommandHandler<UpdateBloggerPostCommand>
{
  private readonly location: string;
  constructor(
    private dataSource: DataSource,
    private blogService: BlogService,
    private postsRepo: PostsRepository,
  ) {
    this.location = 'UpdateBloggerPostUseCase';
  }
  async execute(
    command: UpdateBloggerPostCommand,
  ): Promise<LayerNoticeInterceptor> {
    const { blogId, postId, userId, ...updatePostData } = command.data;
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();

      const blogServiceNotice =
        await this.blogService.validateBlogAndUserRights(
          blogId,
          userId,
          postId,
        );

      if (blogServiceNotice.hasError)
        return blogServiceNotice as LayerNoticeInterceptor<null>;

      const { post } = blogServiceNotice.data;

      const updatedPostDtoNotice = await post.updatePost(updatePostData);

      if (updatedPostDtoNotice.hasError)
        return updatedPostDtoNotice as LayerNoticeInterceptor<null>;

      await this.postsRepo.save(updatedPostDtoNotice.data, manager);

      return notice;
    });
  }
}
