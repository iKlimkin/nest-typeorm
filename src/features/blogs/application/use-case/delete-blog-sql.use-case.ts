import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsSqlRepository } from '../../infrastructure/blogs.sql-repository';
import { DeleteBlogSqlCommand } from './commands/delete-blog-sql.command';
import { BlogsTORRepo } from '../../infrastructure/blogs.typeorm-repository';

@CommandHandler(DeleteBlogSqlCommand)
export class DeleteBlogSqlUseCase
  implements ICommandHandler<DeleteBlogSqlCommand>
{
  constructor(
    private blogsSqlRepository: BlogsSqlRepository,
    private blogsRepo: BlogsTORRepo,
  ) {}

  async execute(command: DeleteBlogSqlCommand): Promise<boolean> {
    return this.blogsRepo.deleteBlog(command.blogId);
  }
}
