import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogService, Post } from '../../../../settings';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreatePostCommand } from './commands/create-post.command';

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  private location: string;
  constructor(
    private postsRepo: PostsRepository,
    private dataSource: DataSource,
    private blogService: BlogService,
  ) {
    this.location = 'CreatePostUseCase';
  }

  async execute(
    command: CreatePostCommand,
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const { postsRepo, dataSource } = this;
    const { blogId, userId, ...createPostData } = command.data;

    return runInTransaction(dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<OutputId | null>();
      const blogServiceNotice =
        await this.blogService.validateBlogAndUserRights(blogId, userId);

      if (blogServiceNotice.hasError)
        return blogServiceNotice as LayerNoticeInterceptor<null>;

      const { blog } = blogServiceNotice.data;

      const createdPostNotice = await Post.create({ ...createPostData, blog });

      if (createdPostNotice.hasError) return createdPostNotice;

      const result = await postsRepo.save(createdPostNotice.data, manager);

      notice.addData(result);
      return notice;
    });
  }
}
