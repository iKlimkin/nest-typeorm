import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';
import { QuizQuestion } from '../../domain/entities/quiz-questions.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { CreateQuestionCommand } from '../commands/create-question.command';
import { QuestionId } from '../../api/models/output.models.ts/output.types';
import { QuizCorrectAnswer } from '../../domain/entities/quiz-correct-answers.entity';

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private readonly quizRepo: QuizRepository) {}

  async execute(
    command: CreateQuestionCommand
  ): Promise<LayerNoticeInterceptor<QuestionId | null>> {
    const notice = new LayerNoticeInterceptor<QuestionId>();
    try {
      await validateOrRejectModel(command, CreateQuestionCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    const { body, correctAnswers } = command.createData;

    const quizQuestionDto = QuizQuestion.create(body);
    const quizAnswersDto = QuizCorrectAnswer.create(correctAnswers); 

    const result = await this.quizRepo.saveQuestionAndAnswers(
      quizQuestionDto,
      quizAnswersDto
    );

    if (!result) {
      notice.addError(
        'Question not created',
        'CreateQuestionUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
