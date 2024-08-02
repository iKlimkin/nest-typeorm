import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BanUnbanBlogCommand } from './commands/banUnbanBlog.command';

@CommandHandler(BanUnbanBlogCommand)
export class BanUnbanBlogUseCase
  implements ICommandHandler<BanUnbanBlogCommand>
{
  private readonly location = this.constructor.name;
  constructor(
    private dataSource: DataSource,
    private blogRepo: BlogsRepository,
  ) {}

  async execute(command: BanUnbanBlogCommand): Promise<LayerNoticeInterceptor> {
    return runInTransaction(this.dataSource, async (manager) => {
      let notice = new LayerNoticeInterceptor();
      const { isBanned, blogId } = command.data;

      const blog = await this.blogRepo.getBlogById(blogId);

      if (!blog) {
        notice.addError('blog not found', this.location, GetErrors.NotFound);
        return notice;
      }

      blog.banUnban(isBanned);
      await this.blogRepo.save(blog, manager);

      return notice;
    });
  }
}
