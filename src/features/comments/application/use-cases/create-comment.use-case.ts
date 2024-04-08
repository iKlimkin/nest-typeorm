import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { CreateCommentCommand } from './commands/create-comment.command';
import { OutputId } from '../../../../domain/output.models';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { CreationCommentDto } from '../../api/models/dtos/comment.dto';

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private userAccountsRepo: UsersRepository,
    private feedbacksRepo: FeedbacksRepository,
  ) {}

  async execute(
    command: CreateCommentCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    try {
      await validateOrRejectModel(command, CreateCommentCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
    }

    const { userId, content, postId } = command.createData;

    const user = await this.userAccountsRepo.getUserById(userId);

    if (!user) {
      notice.addError('User not found', 'db', GetErrors.NotFound);
      return notice;
    }

    const commentDto = new CreationCommentDto({
      postId,
      userId,
      userLogin: user!.login,
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
