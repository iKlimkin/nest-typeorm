import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { DeleteCommentCommand } from './commands/delete-comment.command';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private feedbacksRepository: FeedbacksRepository) {}

  async execute(command: DeleteCommentCommand): Promise<boolean> {
    return await this.feedbacksRepository.deleteComment(command.commentId);
  }
}
