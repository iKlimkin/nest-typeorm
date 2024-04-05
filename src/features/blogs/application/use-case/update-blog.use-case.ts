import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateBlogCommand } from './commands/update-blog.command';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand>
{
  constructor(private blogsRepo: BlogsRepository) {}
  async execute(updateBlogDto: UpdateBlogCommand): Promise<boolean> {
    return this.blogsRepo.updateBlog(updateBlogDto.updateData);
  }
}
