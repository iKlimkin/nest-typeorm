import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './commands/delete-comment.command';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private feedbacksRepo: FeedbacksRepository) {}

  async execute(command: DeleteCommentCommand): Promise<boolean> {
    return this.feedbacksRepo.deleteComment(command.commentId);
  }
}
