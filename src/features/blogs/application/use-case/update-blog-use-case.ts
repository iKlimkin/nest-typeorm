import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogModelType } from '../../domain/entities/blog.schema';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateBlogCommandType } from '../../api/models/input.blog.models/update-blog-models';

export class UpdateBlogCommand {
  constructor(public updateBlogDto: UpdateBlogCommandType) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(updateBlogDto: UpdateBlogCommand): Promise<boolean> {
    const { name, description, websiteUrl, blogId } =
      updateBlogDto.updateBlogDto;

    return this.blogsRepository.updateBlog(blogId, {
      name,
      description,
      websiteUrl,
    });
  }
}
