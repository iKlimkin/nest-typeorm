import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../auth/api/controllers';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { DeleteQuestionCommand } from '../commands/delete-question.command';

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private readonly quizRepo: QuizRepository) {}

  async execute(
    command: DeleteQuestionCommand,
  ): Promise<LayerNoticeInterceptor<boolean | null>> {
    const notice = new LayerNoticeInterceptor<boolean>();

    const { questionId } = command;

    const result = await this.quizRepo.deleteQuestion(questionId);

    if (!result) {
      notice.addError(
        'Question not deleted',
        'DeleteQuestionUseCase',
        GetErrors.DatabaseFail,
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
