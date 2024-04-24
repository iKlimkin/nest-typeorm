import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { PublishQuestionCommand } from '../commands/publish-question.command';

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand>
{
  constructor(private readonly quizRepo: QuizRepository) {}

  async execute(
    command: PublishQuestionCommand
  ): Promise<LayerNoticeInterceptor<boolean | null>> {
    const notice = new LayerNoticeInterceptor<boolean>();

    const result = await this.quizRepo.publishQuestion(command.questionId);

    if (!result) {
      notice.addError(
        'Question not published',
        'PublishQuestionUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
