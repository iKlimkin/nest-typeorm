import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeedbacksSqlRepo } from '../../infrastructure/feedbacks.sql-repository';
import { DeleteCommentSqlCommand } from './commands/delete-comment-sql.command';
import { FeedbacksTORRepo } from '../../infrastructure/feedbacks.typeorm-repository';

@CommandHandler(DeleteCommentSqlCommand)
export class DeleteCommentSqlUseCase
  implements ICommandHandler<DeleteCommentSqlCommand>
{
  constructor(
    private feedbacksSqlRepository: FeedbacksSqlRepo,
    private feedbacksRepo: FeedbacksTORRepo
    ) {}

  async execute(command: DeleteCommentSqlCommand): Promise<boolean> {
    return this.feedbacksRepo.deleteComment(command.commentId);
  }
}
