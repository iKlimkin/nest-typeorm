import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReactionPostType } from '../../../../domain/reaction.models';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { UpdatePostReactionCommand } from './commands/update-post-reaction.command';
import { getStatusCounting } from '../../../../infra/utils/status-counter';

@CommandHandler(UpdatePostReactionCommand)
export class UpdatePostReactionUseCase
  implements ICommandHandler<UpdatePostReactionCommand>
{
  constructor(
    private postsRepo: PostsRepository,
    private usersRepo: UsersRepository,
  ) {}

  async execute(command: UpdatePostReactionCommand) {
    const { postId, userId, inputStatus } = command.updateData;

    const user = await this.usersRepo.getUserById(userId);

    if (!user) throw new Error('User not found');

    const currentStatus = await this.postsRepo.getUserReaction(userId, postId);

    await this.handleReaction({
      postId,
      userId,
      userLogin: user.login,
      inputStatus,
      currentStatus,
    });
  }

  private async handleReaction(reactionPostModel: ReactionPostType) {
    const { postId, currentStatus, inputStatus, userId, userLogin } =
      reactionPostModel;

    const { likesCount, dislikesCount } = getStatusCounting(
      inputStatus,
      currentStatus || 'None',
    );

    const reactionData = {
      postId,
      userId,
      userLogin,
      inputStatus,
      dislikesCount,
      likesCount,
    };

    await this.postsRepo.updateReactionType(reactionData);
  }
}
