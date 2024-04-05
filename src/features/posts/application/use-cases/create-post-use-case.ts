import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { InputPostModel } from '../../api/models/input.posts.models/create.post.model';
import { Post, PostModelType } from '../../domain/entities/posts.schema';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class CreatePostCommand {
  constructor(public createDataDto: InputPostModel) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<OutputId> {
    await validateOrRejectModel(command, CreatePostCommand);

    const { title, shortDescription, content, blogId } = command.createDataDto;

    const foundBlog = await this.blogsRepository.getBlogById(blogId);

    if (!foundBlog) throw new NotFoundException('blog not found');

    const postSmartModel = this.PostModel.makeInstance({
      title,
      shortDescription,
      content,
      blogId: foundBlog._id.toString(),
      blogName: foundBlog.name,
    });

    return this.postsRepository.save(postSmartModel);
  }
}
