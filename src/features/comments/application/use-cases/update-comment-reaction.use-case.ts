import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ReactionCommentDto,
  ReactionCommentType,
} from '../../../../domain/reaction.models';
import { getStatusCounting } from '../../../../infra/utils/status-counter';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { UpdateCommentReactionCommand } from './commands/update-comment-reaction.command';

@CommandHandler(UpdateCommentReactionCommand)
export class UpdateCommentReactionUseCase
  implements ICommandHandler<UpdateCommentReactionCommand>
{
  constructor(private feedbacksRepo: FeedbacksRepository) {}

  async execute(command: UpdateCommentReactionCommand) {
    const { commentId, userId, inputStatus } = command.updateData;

    const existingReaction = await this.feedbacksRepo.getUserReaction(
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

  private async handleReaction(reactionData: ReactionCommentType) {
    const { commentId, currentStatus, inputStatus, userId } = reactionData;

    const { likesCount, dislikesCount } = getStatusCounting(
      inputStatus,
      currentStatus || 'None',
    );

    const reactionDto: ReactionCommentDto = {
      commentId,
      userId,
      inputStatus,
      dislikesCount,
      likesCount,
    };

    await this.feedbacksRepo.updateReactionType(reactionDto);
  }
}
