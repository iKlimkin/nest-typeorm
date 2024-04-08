import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeletePostCommand } from './commands/delete-post.command';
import { PostsRepository } from '../../infrastructure/posts.repository';

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(private postsRepo: PostsRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    this.postsRepo.deletePost(command.postId);
  }
}
