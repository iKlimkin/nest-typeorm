import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ReactionCommentDto,
  ReactionCommentType,
} from '../../../../domain/likes.types';
import { getStatusCounting } from '../../../../infra/utils/status-counter';
import { FeedbacksSqlRepo } from '../../infrastructure/feedbacks.sql-repository';
import { UpdateCommentReactionSqlCommand } from './commands/update-user-reaction-sql.command';
import { FeedbacksTORRepo } from '../../infrastructure/feedbacks.typeorm-repository';
import { log } from 'console';

@CommandHandler(UpdateCommentReactionSqlCommand)
export class UpdateCommentReactionSqlUseCase
  implements ICommandHandler<UpdateCommentReactionSqlCommand>
{
  constructor(
    private feedbacksSqlRepository: FeedbacksSqlRepo,
    private feedbacksRepo: FeedbacksTORRepo,
  ) {}

  async execute(command: UpdateCommentReactionSqlCommand) {
    const { commentId, userId, inputStatus } = command.inputData;

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
