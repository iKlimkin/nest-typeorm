import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BindUserWithBlogCommand } from './commands/bind-user-with-blog.command';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { OutputId } from '../../../../domain/output.models';

@CommandHandler(BindUserWithBlogCommand)
export class BindUserWithBlogUseCase
  implements ICommandHandler<BindUserWithBlogCommand>
{
  private readonly location: string;
  constructor(
    private blogsRepo: BlogsRepository,
    private usersRepo: UsersRepository,
    private dataSource: DataSource,
  ) {
    this.location = 'BindUserWithBlogUseCase';
  }

  async execute(
    command: BindUserWithBlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<OutputId>();
      const { blogId, userId } = command.data;

      const user = await this.usersRepo.getUserById(userId);

      if (!user) {
        notice.addError('User not found', this.location, GetErrors.NotFound);
        return notice;
      }

      const blog = await this.blogsRepo.getBlogById(blogId);

      if (blog.user?.id) {
        notice.addError(
          'Blog has already bounded with user',
          this.location,
          GetErrors.IncorrectModel,
        );
        return notice;
      }

      const updatedBlogDtoNotice = await blog.boundWithUser(user);

      if (updatedBlogDtoNotice.hasError) return updatedBlogDtoNotice;

      const result = await this.blogsRepo.save(
        updatedBlogDtoNotice.data,
        manager,
      );

      notice.addData(result);
      return notice;
    });
  }
}
