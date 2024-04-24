import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';
import { QuizQuestion } from '../../domain/entities/quiz-questions.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { SetPlayerAnswerCommand } from '../commands/set-player-answer.command';
import { AnswerResultViewType } from '../../api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { AnswerStatus } from '../../api/models/input.models/statuses.model';

@CommandHandler(SetPlayerAnswerCommand)
export class SetPlayerAnswerUseCase
  implements ICommandHandler<SetPlayerAnswerCommand>
{
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly dataSource: DataSource
  ) {}

  async execute(
    command: SetPlayerAnswerCommand
  ): Promise<LayerNoticeInterceptor<AnswerResultViewType | null>> {
    const quizRepo = this.quizRepo;
    const notice = new LayerNoticeInterceptor<AnswerResultViewType>();
    const { answer, userId } = command.inputData;
    try {
      await validateOrRejectModel(command, SetPlayerAnswerCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    try {
      return runInTransaction(this.dataSource, async (queryRunner) => {
        const currentGame = await quizRepo.getCurrentGameByUserId(userId);

        const currentPlayer = await quizRepo.getPlayerById(
          currentGame.firstPlayerProgress.id
        );

        const secondPlayer = await quizRepo.getPlayerById(
          currentGame.secondPlayerProgress.id
        );

        if (currentPlayer.answersCount >= 5) {
          notice.addError(
            'first player answers limit',
            'validator',
            GetErrors.Forbidden
          );
          return notice;
        }

        ++currentPlayer.answersCount;

        const question = await quizRepo.getNextQuestion(
          currentGame.id,
          currentPlayer.answersCount
        );

        if (!question) {
          notice.addError('no questions', 'validator', GetErrors.Forbidden);
          return notice;
        }

        const isCorrectAnswer = quizRepo.checkAnswer(answer, question.id);

        currentPlayer.answers.forEach((ans) => {
          ans.answerText = answer;
          ans.answerStatus = isCorrectAnswer
            ? AnswerStatus.Correct
            : AnswerStatus.Incorrect;
          if (isCorrectAnswer) {
            currentPlayer.score++;
          }
        });

        await quizRepo.savePlayerProgress(currentPlayer);

        if (currentPlayer.answersCount === 5) {
          currentPlayer.questCompletionDate = new Date();
          await quizRepo.savePlayerProgress(currentPlayer);
        }

        if (
          currentPlayer.answersCount === 5 &&
          secondPlayer.answersCount === 5
        ) {
          await quizRepo.finishGame(currentGame.id);
        }

        const { firstPlayerProgress, secondPlayerProgress } =
          await quizRepo.getInformationOnPlayerProgress(
            currentPlayer.id,
            secondPlayer.id
          );

        const isFirstPlayerFinishedEarly =
          firstPlayerProgress.questCompletionDate.getTime() <
          secondPlayerProgress.questCompletionDate.getTime();

        if (isFirstPlayerFinishedEarly && firstPlayerProgress.score > 0) {
          currentPlayer.score++;
          await quizRepo.savePlayerProgress(currentPlayer);
        } else if (
          !isFirstPlayerFinishedEarly &&
          secondPlayerProgress.score > 0
        ) {
          secondPlayer.score++;
          await quizRepo.savePlayerProgress(secondPlayer);
        }

        const result = await quizRepo.findAnswerByText(
          answer,
          currentPlayer.id
        );
        let addedAt = result.created_at.toISOString();
        let answerStatus = result.answerStatus;
        let questionId = question.id;
        const responseData = { addedAt, answerStatus, questionId };

        if (!result) {
          notice.addError(
            'Answer not realized',
            'SetPlayerAnswer',
            GetErrors.DatabaseFail
          );
        } else {
          notice.addData(responseData);
        }

        return notice;
      });
    } catch (error) {
      notice.addError('transaction error', 'database', GetErrors.DatabaseFail);
      return notice;
    }
  }
}
