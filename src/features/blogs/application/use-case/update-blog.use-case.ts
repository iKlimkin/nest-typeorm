import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogService } from '../blog.service';
import { UpdateBlogCommand } from './commands/update-blog.command';

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  private readonly location: string;
  constructor(
    private blogsRepo: BlogsRepository,
    private dataSource: DataSource,
    private blogService: BlogService,
  ) {
    this.location = 'UpdateBlogUseCase';
  }
  async execute(
    command: UpdateBlogCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const { blogId, description, name, websiteUrl, userId } = command.data;
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<boolean | null>();
      const blogServiceNotice =
        await this.blogService.validateBlogAndUserRights(blogId, userId);

      if (blogServiceNotice.hasError)
        return blogServiceNotice as LayerNoticeInterceptor<null>;

      const { blog } = blogServiceNotice.data;

      const updatedBlogNotice = await blog.update({
        description,
        name,
        websiteUrl,
      });
      if (updatedBlogNotice.hasError)
        return updatedBlogNotice as LayerNoticeInterceptor<null>;

      await this.blogsRepo.save(updatedBlogNotice.data, manager);
      return notice;
    });
  }
}
