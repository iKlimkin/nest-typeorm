import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { UpdateQuestionCommand } from '../commands/update-question.command';

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly quizRepo: QuizRepository) {}

  async execute(
    command: UpdateQuestionCommand
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const notice = new LayerNoticeInterceptor<boolean>();
    try {
      await validateOrRejectModel(command, UpdateQuestionCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    const { body, correctAnswers, published, questionId } = command.updateData;

    if (!correctAnswers.length && published) {
      notice.addError(
        'Question must have at least one correct answer',
        'UpdateQuestionUseCase',
        GetErrors.IncorrectModel
      );
      return notice;
    }

    const result = await this.quizRepo.updateQuestionAndAnswers({
      body,
      correctAnswers,
      questionId,
    });

    if (!result) {
      notice.addError(
        'Question not updated',
        'UpdateQuestionUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
