import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDBType } from '../../api/models/output.blog.models/blog.models';

export class DeleteBlogCommand {
  constructor(public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<BlogDBType> {
    return await this.blogsRepository.deleteBlog(command.blogId);
  }
}
