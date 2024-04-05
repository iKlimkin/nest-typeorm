import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { UpdateCommentCommand } from './commands/update-comment.command';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private feedbacksRepository: FeedbacksRepository) {}

  async execute(command: UpdateCommentCommand): Promise<boolean> {
    return this.feedbacksRepository.updateComment(
      command.commentId,
      command.content,
    );
  }
}
