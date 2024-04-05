import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getStatusCounting } from '../../../../infra/utils/status-counter';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { UpdateCommentReactionCommand } from './commands/update-user-reaction.command';
import { ReactionCommentDto, ReactionCommentType } from '../../../../domain/likes.types';


@CommandHandler(UpdateCommentReactionCommand)
export class UpdateCommentReactionUseCase
  implements ICommandHandler<UpdateCommentReactionCommand>
{
  constructor(private feedbacksRepository: FeedbacksRepository) {}

  async execute(command: UpdateCommentReactionCommand) {
    const { commentId, userId, inputStatus } = command.inputData;

    const existingReaction = await this.feedbacksRepository.getUserReaction(
      userId,
      commentId,
    );

    await this.handleReaction({
      commentId,
      userId,
      inputStatus,
      currentStatus: existingReaction,
    });
  }

  private async handleReaction(reactionDto: ReactionCommentType) {
    const { commentId, currentStatus, inputStatus, userId } = reactionDto;

    const { likesCount, dislikesCount } = getStatusCounting(
      inputStatus,
      currentStatus || 'None',
    );

    const reactionData: ReactionCommentDto = {
      commentId,
      userId,
      inputStatus,
      dislikesCount,
      likesCount,
    };

    if (!currentStatus) {
      await this.feedbacksRepository.createLikeStatus(reactionData);
    } else {
      await this.feedbacksRepository.updateLikeStatus(reactionData);
    }
  }
}
