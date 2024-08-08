import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UnsubscribeBlogCommand } from './commands/unSubscribe-blog.command';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { SubscribeEnum } from '../../api/models/output.blog.models/blog.view.model-type';

@CommandHandler(UnsubscribeBlogCommand)
export class UnsubscribeBlogUseCase
  implements ICommandHandler<UnsubscribeBlogCommand>
{
  constructor(
    private blogsRepo: BlogsRepository,
    private dataSource: DataSource,
  ) {}

  async execute(
    command: UnsubscribeBlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor();
      const { blogId, userId } = command;

      const { blog, subscription } =
        await this.blogsRepo.getBlogWithSubscription(blogId, userId, manager);

      if (!blog) {
        notice.addError('Blog does not exist', '', GetErrors.NotFound);
        return notice;
      }

      if (!subscription) {
        notice.addError(
          `you can't unsubscribe from a blog that you haven't subscribed to before`,
          'unsub',
          GetErrors.IncorrectModel,
        );
        return notice;
      }

      if (subscription.subscribeStatus === SubscribeEnum.Unsubscribed)
        return notice;

      subscription.unsubscribe();

      await this.blogsRepo.saveEntity(subscription, manager);

      return notice;
    });
  }
}
