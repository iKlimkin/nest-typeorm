import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { UsersSQLRepository } from '../../../admin/infrastructure/users.sql-repository';
import { CommentDtoSqlModel } from '../../api/models/comment-dto-sql.model';
import { FeedbacksSqlRepo } from '../../infrastructure/feedbacks.sql-repository';
import { CreateCommentSqlCommand } from './commands/create-comment-sql.command';
import { FeedbacksTORRepo } from '../../infrastructure/feedbacks.typeorm-repository';
import { UserAccountsTORRepo } from '../../../admin/infrastructure/users.repo';

@CommandHandler(CreateCommentSqlCommand)
export class CreateCommentSqlUseCase
  implements ICommandHandler<CreateCommentSqlCommand>
{
  constructor(
    private feedbacksSqlRepo: FeedbacksSqlRepo,
    private usersSqlRepository: UsersSQLRepository,
    private userAccountsRepo: UserAccountsTORRepo,
    private feedbacksRepo: FeedbacksTORRepo,
  ) {}

  async execute(
    command: CreateCommentSqlCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    try {
      await validateOrRejectModel(command, CreateCommentSqlCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
    }

    const { userId, content, postId } = command.inputData;

    const user = await this.userAccountsRepo.getUserById(userId);

    if (!user) {
      notice.addError('User not found', 'db', GetErrors.NotFound);
      return notice;
    }

    const commentDto = new CommentDtoSqlModel({
      postId,
      userId,
      userlogin: user!.login,
      content,
    });

    const result = await this.feedbacksRepo.createComment(commentDto);

    if (result) {
      notice.addData(result);
    } else {
      notice.addError('Post not created', 'db', GetErrors.DatabaseFail);
    }

    return notice;
  }
}
