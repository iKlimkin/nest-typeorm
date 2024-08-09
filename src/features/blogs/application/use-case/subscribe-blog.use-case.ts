import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { Subscription } from '../../domain/entities/blog-subscription.entity';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { SubscribeBlogCommand } from './commands/subscribe-blog.command';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { SubscribeEnum } from '../../api/models/output.blog.models/blog.view.model-type';

@CommandHandler(SubscribeBlogCommand)
export class SubscribeBlogUseCase
  implements ICommandHandler<SubscribeBlogCommand>
{
  constructor(
    private blogsRepo: BlogsRepository,
    private dataSource: DataSource,
  ) {}

  async execute(
    command: SubscribeBlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();
      const { blogId, userId } = command;

      const { blog, subscription: sub } =
        await this.blogsRepo.getBlogWithSubscription(blogId, userId, manager);

      if (!blog) {
        notice.addError('Blog does not exist', 'sub', GetErrors.NotFound);
        return notice;
      }
      if (blog.user.id === userId) {
        notice.addError(
          'You cannot subscribe to your own blog',
          'sub',
          GetErrors.IncorrectModel,
        );
        return notice;
      }

      if (sub) {
        if (sub.subscribeStatus === SubscribeEnum.Unsubscribed) {
          sub.subscribe();
          await this.blogsRepo.saveEntity(sub, manager);
        }
        return notice;
      }

      const newSubscription = Subscription.create(userId, blogId);
      await this.blogsRepo.saveEntity(newSubscription, manager);

      return notice;
    });
  }
}
