import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { AnswerResultViewType } from '../../api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { SetPlayerAnswerCommand } from '../commands/set-player-answer.command';

interface IPlayerWithAnswer {
  playerAnswer: QuizAnswer;
  savedPlayerAnswer: QuizAnswer;
}
interface IHandleLastAnswerInput {
  answer: string;
  currentPlayerProgress: QuizPlayerProgress;
  otherPlayerProgress: QuizPlayerProgress;
  manager: EntityManager;
  gameId: string
}
interface IGameResultHandler extends Omit<IHandleLastAnswerInput, 'answer'> {}

@CommandHandler(SetPlayerAnswerCommand)
export class SetPlayerAnswerUseCase
  implements ICommandHandler<SetPlayerAnswerCommand>
{
  private readonly location: string;
  private readonly notice: LayerNoticeInterceptor<AnswerResultViewType>;
  private readonly lastPoint: number;

  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly dataSource: DataSource
  ) {
    this.notice = new LayerNoticeInterceptor();
    this.lastPoint = 5;
    this.location = 'SetPlayerAnswerUseCase'
  }

  async execute(
    command: SetPlayerAnswerCommand
  ): Promise<LayerNoticeInterceptor<AnswerResultViewType>> {
    const { quizRepo, notice, lastPoint, location } = this;
    const { answer, userId } = command.inputData;
    try {
      await validateOrRejectModel(command, SetPlayerAnswerCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    try {
      return runInTransaction(this.dataSource, async (manager) => {
        let { firstPlayerProgress, secondPlayerProgress, firstPlayerId, id: gameId } =
          await quizRepo.getCurrentGameByUserId(userId, manager);
        
        let currentPlayerProgress: QuizPlayerProgress;
        let otherPlayerProgress: QuizPlayerProgress;

        debugger;
        firstPlayerId === userId
          ? (currentPlayerProgress = firstPlayerProgress) &&
            (otherPlayerProgress = secondPlayerProgress)
          : (currentPlayerProgress = secondPlayerProgress) &&
            (otherPlayerProgress = firstPlayerProgress);

        if (currentPlayerProgress.isExceededAnswerLimit(lastPoint)) {
          notice.addError(
            'player answers limit',
            location,
            GetErrors.Forbidden
          );
          return notice;
        }

        currentPlayerProgress.incrementAnswersCount();

        if (currentPlayerProgress.isLastAnswer(lastPoint)) {
          return this.handleLastAnswer({
            answer,
            currentPlayerProgress,
            manager,
            otherPlayerProgress,
            gameId,
          });
        }

        const result = await this.checkAndCreateAnswer(
          answer,
          gameId,
          currentPlayerProgress,
          manager
        );

        if (result.hasError) {
          notice.addError(result.errorMessage, location, result.code);
          return notice;
        }

        const { playerAnswer, savedPlayerAnswer } = result.data;

        if (playerAnswer.isCorrectAnswer()) {
          currentPlayerProgress.incrementScore();
        }

        await quizRepo.saveProgress(currentPlayerProgress, manager);

        const { created_at, answerStatus, questionId } = savedPlayerAnswer;

        const responseData: AnswerResultViewType = {
          addedAt: created_at.toISOString(),
          answerStatus,
          questionId,
        };

        if (!savedPlayerAnswer) {
          notice.addError(
            'Answer not realized',
            location,
            GetErrors.DatabaseFail
          );
        } else {
          notice.addData(responseData);
        }

        return notice;
      });
    } catch (error) {
      notice.addError('transaction error', location, GetErrors.Transaction);
      return notice;
    }
  }

  private async checkAndCreateAnswer(
    answer: string,
    gameId: string,
    currentPlayerProgress: QuizPlayerProgress,
    manager: EntityManager
  ): Promise<LayerNoticeInterceptor<IPlayerWithAnswer>> {
    const notice = new LayerNoticeInterceptor<IPlayerWithAnswer>();
    const { location, quizRepo } = this;
    try {
      const question = await quizRepo.getCurrentGameQuestion(
        gameId,
        currentPlayerProgress.answersCount
      );

      if (!question.questionId) {
        notice.addError('Question not found', location, GetErrors.DatabaseFail);
        return notice;
      }

      const correctAnswers = await quizRepo.getAnswersForCurrentQuestion(
        question.questionId,
        manager
      );

      const isCorrectAnswer = correctAnswers.some((correctAnswer) =>
        correctAnswer.isCorrectAnswer(answer)
      );

      const playerAnswer = QuizAnswer.create({
        answerText: answer,
        isCorrect: isCorrectAnswer,
        questionId: question.questionId,
        playerProgress: currentPlayerProgress,
      });

      const savedPlayerAnswer = await quizRepo.saveAnswer(
        playerAnswer,
        manager
      );

      if (!savedPlayerAnswer) {
        notice.addError('Answer not saved', location, GetErrors.DatabaseFail);
      } else {
        const responseData = { playerAnswer, savedPlayerAnswer };
        notice.addData(responseData);

        return notice;
      }
    } catch (error) {
      notice.addError('Answer not realized', location, GetErrors.DatabaseFail);
      return notice;
    }
  }

  private async handleLastAnswer(
    inputHandleDto: IHandleLastAnswerInput
  ): Promise<LayerNoticeInterceptor<AnswerResultViewType>> {
    const { notice, location, quizRepo } = this;
    const { answer, currentPlayerProgress, manager, otherPlayerProgress, gameId } =
      inputHandleDto;

    currentPlayerProgress.setCompletionDate();

    const result = await this.checkAndCreateAnswer(
      answer,
      gameId,
      currentPlayerProgress,
      manager
    );

    if (result.hasError) {
      notice.addError(result.errorMessage, location, result.code);
      return notice;
    }

    const { playerAnswer, savedPlayerAnswer } = result.data;

    if (playerAnswer.isCorrectAnswer()) {
      currentPlayerProgress.incrementScore();
    }

    await quizRepo.saveProgress(currentPlayerProgress, manager);

    const isCurrentGameCompleted =
      currentPlayerProgress.isGameCompleted(otherPlayerProgress);

    if (isCurrentGameCompleted) {
      await this.finishGameAndHandleBonuses({
        gameId,
        currentPlayerProgress,
        otherPlayerProgress,
        manager,
      });
    }

    const { created_at, answerStatus, questionId } = savedPlayerAnswer;

    const responseData = {
      addedAt: created_at.toISOString(),
      answerStatus,
      questionId,
    };

    if (!savedPlayerAnswer) {
      notice.addError('Answer not realized', location, GetErrors.DatabaseFail);
    } else {
      notice.addData(responseData);
    }

    return notice;
  }

  private async finishGameAndHandleBonuses(
    gameResultDto: IGameResultHandler
  ): Promise<void> {
    const { gameId, currentPlayerProgress, otherPlayerProgress, manager } =
      gameResultDto;
    try {
      await this.quizRepo.finishGame(gameId, manager);

      const isFirstPlayerFinishedEarly =
        currentPlayerProgress.isCurrentPlayerFinishedEarlierThan(
          otherPlayerProgress
        );

      if (
        currentPlayerProgress.isPlayerDeservesBonus(isFirstPlayerFinishedEarly)
      ) {
        currentPlayerProgress.incrementScore();
        await this.quizRepo.saveProgress(currentPlayerProgress, manager);
      } else if (
        otherPlayerProgress.isPlayerDeservesBonus(!isFirstPlayerFinishedEarly)
      ) {
        otherPlayerProgress.incrementScore();
        await this.quizRepo.saveProgress(otherPlayerProgress, manager);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
