import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { UpdatePostModel } from '../../api/models/input.posts.models/create.post.model';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class UpdatePostCommand {
  constructor(public updatePostDto: UpdatePostModel & { blogId: string }) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(private postsRepository: PostsRepository) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    try {
      await validateOrRejectModel(command, UpdatePostCommand);
    } catch (error) {
      console.log(error);
      return false;
    }

    return this.postsRepository.updatePost(
      command.updatePostDto.postId,
      command.updatePostDto,
    );
  }
}
