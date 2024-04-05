import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsSqlRepository } from '../../infrastructure/blogs.sql-repository';
import { UpdateBlogSqlCommand } from './commands/update-blog-sql.command';
import { BlogsTORRepo } from '../../infrastructure/blogs.typeorm-repository';

@CommandHandler(UpdateBlogSqlCommand)
export class UpdateBlogSqlUseCase
  implements ICommandHandler<UpdateBlogSqlCommand>
{
  constructor(
    private blogsSqlRepository: BlogsSqlRepository,
    private blogsRepo: BlogsTORRepo,
  ) {}
  async execute(updateBlogDto: UpdateBlogSqlCommand): Promise<boolean> {
    return this.blogsRepo.updateBlog(updateBlogDto.updateBlogDto);
  }
}
