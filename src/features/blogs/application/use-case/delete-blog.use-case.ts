import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogService } from '../blog.service';
import { DeleteBlogCommand } from './commands/delete-blog.command';

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  private readonly location: string;
  constructor(
    private blogsRepo: BlogsRepository,
    private blogService: BlogService,
    private dataSource: DataSource,
  ) {
    this.location = 'DeleteBlogUseCase';
  }

  async execute(
    command: DeleteBlogCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const { userId, blogId } = command.data;
    const { location, blogsRepo, dataSource, blogService } = this;
    return runInTransaction(dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<boolean>();

      const blogServiceNotice = await blogService.validateBlogAndUserRights(
        blogId,
        userId,
      );

      if (blogServiceNotice.hasError) return blogServiceNotice as any;

      const result = await blogsRepo.deleteBlog(blogId, manager);
      
      if (!result) {
        notice.addError(
          `Couldn't delete blog`,
          location,
          GetErrors.DatabaseFail,
        );
      } else {
        notice.addData(result);
      }

      return notice;
    });
  }
}
