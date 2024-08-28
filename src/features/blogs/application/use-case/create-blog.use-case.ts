import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateBlogCommand } from './commands/create-blog.command';
import { CreateBlogMembershipPlansEvent } from '../events/create-blog-membership-plans.event-handler';

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private blogsRepo: BlogsRepository,
    private dataSource: DataSource,
    private eventBus: EventBus,
  ) {}

  async execute(
    command: CreateBlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<OutputId>();
      const { description, name, websiteUrl, userId } = command.data;

      const createdBlogNotice = await Blog.create({
        name,
        description,
        websiteUrl,
        userId,
      });

      if (createdBlogNotice.hasError) return createdBlogNotice;

      const result = await this.blogsRepo.save(createdBlogNotice.data, manager);

      const event = new CreateBlogMembershipPlansEvent(result.id);
      this.eventBus.publish(event);

      notice.addData(result);
      return notice;
    });
  }
}
