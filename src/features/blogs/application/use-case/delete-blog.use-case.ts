import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteBlogCommand } from './commands/delete-blog.command';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private blogsRepo: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<boolean> {
    return this.blogsRepo.deleteBlog(command.blogId);
  }
}
