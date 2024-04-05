import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentSqlCommand } from './commands/update-comment-sql.command';
import { FeedbacksSqlRepo } from '../../infrastructure/feedbacks.sql-repository';
import { FeedbacksTORRepo } from '../../infrastructure/feedbacks.typeorm-repository';

@CommandHandler(UpdateCommentSqlCommand)
export class UpdateCommentSqlUseCase
  implements ICommandHandler<UpdateCommentSqlCommand>
{
  constructor(
    private feedbacksSqlRepository: FeedbacksSqlRepo,
    private feedbacksRepo: FeedbacksTORRepo,
  ) {}

  async execute(command: UpdateCommentSqlCommand): Promise<boolean> {
    return this.feedbacksRepo.updateComment(command.commentId, command.content);
  }
}
