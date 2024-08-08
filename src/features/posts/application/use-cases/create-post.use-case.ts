import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { TelegramAdapter } from '../../../../infra/adapters/telegram.adapter';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogService } from '../../../blogs/application/blog.service';
import { IntegrationsRepository } from '../../../integrations/infrastructure/integrations.repository';
import { Post } from '../../domain/entities/post.entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreatePostCommand } from './commands/create-post.command';
import { NotifySubscribersEvent } from '../../../blogs/application/events/created-post-notify.event';

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private postsRepo: PostsRepository,
    private dataSource: DataSource,
    private blogService: BlogService,
    private integrationsRepo: IntegrationsRepository,
    private tgAdapter: TelegramAdapter,
    private eventBus: EventBus,
  ) {}

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

      this.eventBus.publish(new NotifySubscribersEvent(blogId, blog.title));

      notice.addData(result);
      return notice;
    });
  }

}
