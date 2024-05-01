import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { AnswerStatus } from '../../api/models/input.models/statuses.model';
import { AnswerResultViewType } from '../../api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { SetPlayerAnswerCommand } from '../commands/set-player-answer.command';
import { CurrentGameQuestion } from '../../domain/entities/current-game-questions.entity';
import { ForbiddenException } from '@nestjs/common';

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
    const lastPoint = 5;
    const notice = new LayerNoticeInterceptor<AnswerResultViewType>();
    const { answer, userId } = command.inputData;
    try {
      await validateOrRejectModel(command, SetPlayerAnswerCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    try {
      return runInTransaction(this.dataSource, async (manager) => {
        let {
          firstPlayerProgress,
          secondPlayerProgress,
          id: gameId,
          firstPlayerId,
        } = await quizRepo.getCurrentGameByUserId(userId, manager);

        let currentPlayerProgress: QuizPlayerProgress;
        let otherPlayerProgress: QuizPlayerProgress;

        debugger;
        firstPlayerId === userId
          ? (currentPlayerProgress = firstPlayerProgress) &&
            (otherPlayerProgress = secondPlayerProgress)
          : (currentPlayerProgress = secondPlayerProgress) &&
            (otherPlayerProgress = firstPlayerProgress);

        if (currentPlayerProgress.answersCount >= lastPoint) {
          notice.addError(
            'player answers limit',
            'validator',
            GetErrors.Forbidden
          );
          return notice;
        }

        currentPlayerProgress.incrementAnswersCount();

        if (currentPlayerProgress.answersCount === lastPoint) {
          currentPlayerProgress.questCompletionDate = new Date();

          const { playerAnswer, savedPlayerAnswer } =
            await this.checkAndCreateAnswer(
              answer,
              gameId,
              currentPlayerProgress
            );

          if (playerAnswer.answerStatus === AnswerStatus.Correct) {
            currentPlayerProgress.incrementScore();
          }

          if (
            currentPlayerProgress.answersCount > 4 &&
            otherPlayerProgress.answersCount > 4
          ) {
            await quizRepo.finishGame(gameId);

            const isFirstPlayerFinishedEarly =
              currentPlayerProgress.questCompletionDate.getTime() <
              otherPlayerProgress.questCompletionDate.getTime();

            if (
              currentPlayerProgress.deservesBonusUser(
                isFirstPlayerFinishedEarly
              )
            ) {
              currentPlayerProgress.incrementScore();
            } else if (
              otherPlayerProgress.deservesBonusUser(!isFirstPlayerFinishedEarly)
            ) {
              otherPlayerProgress.incrementScore();
              await quizRepo.saveProgress(otherPlayerProgress, manager);
            }
          }

          await quizRepo.saveProgress(currentPlayerProgress, manager);

          const { created_at, answerStatus, questionId } = savedPlayerAnswer;

          const responseData = {
            addedAt: created_at.toISOString(),
            answerStatus,
            questionId,
          };

          if (!savedPlayerAnswer) {
            notice.addError(
              'Answer not realized',
              'SetPlayerAnswer',
              GetErrors.DatabaseFail
            );
          } else {
            notice.addData(responseData);
          }

          return notice;
        }

        const { playerAnswer, savedPlayerAnswer } =
          await this.checkAndCreateAnswer(
            answer,
            gameId,
            currentPlayerProgress
          );

        if (playerAnswer.isCorrectAnswer(playerAnswer.answerStatus)) {
          currentPlayerProgress.incrementScore();
        }

        await quizRepo.saveProgress(currentPlayerProgress, manager);

        const { created_at, answerStatus, questionId } = savedPlayerAnswer;

        const responseData = {
          addedAt: created_at.toISOString(),
          answerStatus,
          questionId,
        };

        if (!savedPlayerAnswer) {
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

  private async checkAndCreateAnswer(
    answer: string,
    gameId: string,
    currentPlayerProgress: QuizPlayerProgress
  ): Promise<{ playerAnswer: QuizAnswer; savedPlayerAnswer: QuizAnswer }> {
    try {
      const question = await this.quizRepo.getCurrentGameQuestion(
        gameId,
        currentPlayerProgress.answersCount
      );

      if (!question.questionId) {
        throw new ForbiddenException('Question not found');
      }

      const isCorrectAnswer = await this.quizRepo.checkAnswer(
        answer,
        question.questionId
      );

      const playerAnswer = QuizAnswer.create({
        answerText: answer,
        isCorrect: isCorrectAnswer,
        questionId: question.questionId,
        playerProgress: currentPlayerProgress,
      });

      const savedPlayerAnswer = await this.quizRepo.saveAnswer(playerAnswer);

      return { playerAnswer, savedPlayerAnswer };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
