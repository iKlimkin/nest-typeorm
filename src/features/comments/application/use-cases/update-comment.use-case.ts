import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { UpdateCommentCommand } from './commands/update-comment.command';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private feedbacksRepo: FeedbacksRepository) {}

  async execute(command: UpdateCommentCommand): Promise<boolean> {
    return this.feedbacksRepo.updateComment(command.commentId, command.content);
  }
}
