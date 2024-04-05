import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ReactionPostDtoType,
  ReactionPostType,
} from '../../../../domain/likes.types';
import { getStatusCounting } from '../../../../infra/utils/status-counter';
import { PostsSqlRepository } from '../../infrastructure/posts.sql-repository';
import { UpdatePostReactionSqlCommand } from './commands/update-post-reaction-sql.command';
import { UserAccountsTORRepo } from '../../../admin/infrastructure/users.repo';
import { PostsTorRepo } from '../../infrastructure/posts.typeorm-repository';

@CommandHandler(UpdatePostReactionSqlCommand)
export class UpdatePostReactionSqlUseCase
  implements ICommandHandler<UpdatePostReactionSqlCommand>
{
  constructor(
    private postsSqlRepository: PostsSqlRepository,
    private postsRepo: PostsTorRepo,
    private usersRepo: UserAccountsTORRepo,
  ) {}

  async execute(command: UpdatePostReactionSqlCommand) {
    const { postId, userId, inputStatus } = command.updatePostReactionDto;

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

    const reactionData: ReactionPostDtoType = {
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
