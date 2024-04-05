import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { DeleteSABlogCommand } from './commands/delete-sa-blog.command';

@CommandHandler(DeleteSABlogCommand)
export class DeleteSABlogUseCase
  implements ICommandHandler<DeleteSABlogCommand>
{
  constructor(private blogsRepo: BlogsRepository) {}

  async execute(command: DeleteSABlogCommand): Promise<boolean> {
    return this.blogsRepo.deleteBlog(command.blogId);
  }
}
