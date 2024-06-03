import { HttpServer, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { cleanDatabase } from '../../../../test/tools/utils/dataBaseCleanup';
import { initSettings } from '../../../../test/tools/utils/initSettings';
import { SetPlayerAnswerCommand } from '../application/commands/set-player-answer.command';
import { SetPlayerAnswerUseCase } from '../application/use-cases/set-player-answer.use-case';
import { QuizRepoMockForSetAnswer, startGame } from './mock/quizRepoMock';
import { QuizRepository } from '../infrastructure/quiz-game.repo';
import { QuizPlayerProgress } from '../domain/entities/quiz-player-progress.entity';
import * as transactionModule from '../../../domain/transaction-wrapper';
import { GetErrors } from '../../../infra/utils/interlay-error-handler.ts/error-constants';
import { QuizAnswer } from '../domain/entities/quiz-answer.entity';
import { LayerNoticeInterceptor } from '../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

describe('Set-answer-use-case', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let dataSource: DataSource;
  let setPlayerAnswerUseCase: SetPlayerAnswerUseCase;
  let quizRepoMock: QuizRepoMockForSetAnswer;
  let quizRepo: QuizRepository;
  let firstPlayerUserId: string = '1';
  let secondPlayerUserId: string = '123';

  beforeAll(async () => {
    const settings = await initSettings((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(QuizRepository)
        .useClass(QuizRepoMockForSetAnswer),
    );

    app = settings.app;
    httpServer = settings.httpServer;
    dataSource = settings.testingAppModule.get(DataSource);

    quizRepoMock = new QuizRepoMockForSetAnswer();
    quizRepo = app.get(QuizRepository);
    setPlayerAnswerUseCase = app.get(SetPlayerAnswerUseCase);
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  describe('testing positive cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('testing send correct answer', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: secondPlayerUserId,
        answer: '1',
      });

      const res = await setPlayerAnswerUseCase.execute(command);

      expect(res.data.answerStatus).toBe('Correct');
      expect(res.data.questionId).toBe('1');
    });

    it('should increment answers count when process steps; call isCorrectAnswer and not called incrementScore with wrong answer', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: secondPlayerUserId,
        answer: '0',
      });
      const incrementAnswersCountSpy = jest.spyOn(
        QuizPlayerProgress.prototype,
        'incrementAnswersCount',
      );
      const incrementScore = jest.spyOn(
        QuizPlayerProgress.prototype,
        'incrementScore',
      );
      const isLastAnswer = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isLastAnswer',
      );
      const isCorrectAnswer = jest.spyOn(
        QuizAnswer.prototype,
        'isCorrectAnswer',
      );
      const saveProgressSpy = jest
        .spyOn(quizRepo, 'saveProgress')
        .mockImplementationOnce(quizRepoMock.saveProgress);

      const res = await setPlayerAnswerUseCase.execute(command);

      expect(incrementAnswersCountSpy).toHaveBeenCalled();
      expect(isCorrectAnswer).toHaveBeenCalled();
      expect(saveProgressSpy).toHaveBeenCalled();
      expect(incrementScore).not.toHaveBeenCalled();
      expect(isLastAnswer).toHaveReturnedWith(false);

      expect(res.data.answerStatus).toBe('Incorrect');
      expect(res.data.questionId).toBe('1');
    });

    it('should correct handle error in transaction', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: secondPlayerUserId,
        answer: '0',
      });

      quizRepo.getCurrentGameByUserId = jest.fn().mockImplementationOnce(() => {
        throw new Error('error');
      });

      const res = await setPlayerAnswerUseCase.execute(command);

      expect(res.extensions[0].key).toBe('runInTransaction');
      expect(res.code).toBe(500);
    });

    it('should handle transaction error', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: 'test-user-id',
        answer: 'test-answer',
      });

      const notice = new LayerNoticeInterceptor();
      notice.addError(
        'transaction error',
        'runInTransaction',
        GetErrors.Transaction,
      );

      jest
        .spyOn(transactionModule, 'runInTransaction')
        .mockImplementation(async () => {
          return notice;
        });

      const result = await setPlayerAnswerUseCase.execute(command);

      expect(result.hasError).toBe(true);
      expect(result.extensions[0].message).toBe('transaction error');
    });

    it('send correct answer, checking of response methods when responding correctly', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: secondPlayerUserId,
        answer: '2',
      });
      const answerPoint = 4;

      const incrementScore = jest.spyOn(
        QuizPlayerProgress.prototype,
        'incrementScore',
      );
      const setCompletionDate = jest.spyOn(
        QuizPlayerProgress.prototype,
        'setCompletionDate',
      );
      const isLastAnswer = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isLastAnswer',
      );
      const isGameCompleted = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isGameCompleted',
      );
      const isCorrectAnswer = jest.spyOn(
        QuizAnswer.prototype,
        'isCorrectAnswer',
      );

      const saveProgressSpy = jest
        .spyOn(quizRepo, 'saveProgress')
        .mockImplementationOnce(quizRepoMock.saveProgress);

      const mockCurrentGame = startGame(command.inputData.userId, {
        sPAnswerCount: answerPoint,
      });

      quizRepo.getCurrentGameByUserId = jest
        .fn()
        .mockReturnValueOnce(mockCurrentGame);

      const result = await setPlayerAnswerUseCase.execute(command);

      expect(result.data).toBeDefined();

      expect(isLastAnswer).toHaveReturnedWith(true);
      expect(setCompletionDate).toHaveBeenCalled();
      expect(isGameCompleted).toHaveReturnedWith(false);
      expect(isCorrectAnswer).toHaveReturnedWith(true);
      expect(incrementScore).toHaveBeenCalled();
      expect(saveProgressSpy).toHaveBeenCalled();
    });

    it('should handle finish game through second player; fPFinishedEarlier', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: secondPlayerUserId,
        answer: '2',
      });
      const answerPoint = 5;

      const mockCurrentGame = startGame(command.inputData.userId, {
        fPAnswerCount: answerPoint,
        sPAnswerCount: answerPoint - 1,
        fPFinishedGame: true,
        fPScore: 2,
        sPScore: 1,
      });

      quizRepo.getCurrentGameByUserId = jest
        .fn()
        .mockReturnValueOnce(mockCurrentGame);

      const isExceededAnswerLimit = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isExceededAnswerLimit',
      );
      const isLastAnswer = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isLastAnswer',
      );
      const incrementScore = jest.spyOn(
        QuizPlayerProgress.prototype,
        'incrementScore',
      );
      const setCompletionDate = jest.spyOn(
        QuizPlayerProgress.prototype,
        'setCompletionDate',
      );
      const saveProgressSpy = jest
        .spyOn(quizRepo, 'saveProgress')
        .mockImplementationOnce(quizRepoMock.saveProgress);
      const finishGame = jest
        .spyOn(quizRepo, 'finishGame')
        .mockImplementationOnce(quizRepoMock.finishGame);
      const isGameCompleted = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isGameCompleted',
      );
      const isCurrentPlayerFinishedEarlierThan = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isCurrentPlayerFinishedEarlierThan',
      );
      const isPlayerDeservesBonus = jest.spyOn(
        QuizPlayerProgress.prototype,
        'isPlayerDeservesBonus',
      );
      const isCorrectAnswer = jest.spyOn(
        QuizAnswer.prototype,
        'isCorrectAnswer',
      );

      const result = await setPlayerAnswerUseCase.execute(command);

      expect(result.data).toBeDefined();

      expect(isExceededAnswerLimit).toHaveReturnedWith(false);
      expect(isLastAnswer).toHaveReturnedWith(true);
      expect(setCompletionDate).toHaveBeenCalled();
      expect(isCorrectAnswer).toHaveReturnedWith(true);
      expect(saveProgressSpy).toHaveBeenCalledTimes(2);
      expect(isGameCompleted).toHaveReturnedWith(true);
      expect(finishGame).toHaveBeenCalled();
      expect(isCurrentPlayerFinishedEarlierThan).toHaveReturnedWith(false);
      expect(isPlayerDeservesBonus).toHaveBeenCalledTimes(2);
      expect(incrementScore).toHaveBeenCalled();
    });
    it('should handle finish game through first player', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: firstPlayerUserId,
        answer: '2',
      });
      const answerPoint = 5;
 
      const mockCurrentGame = startGame(command.inputData.userId, {
        fPAnswerCount: answerPoint - 1,
        sPAnswerCount: answerPoint,
        sPFinishedGame: true,
      });

      quizRepo.getCurrentGameByUserId = jest
        .fn()
        .mockReturnValueOnce(mockCurrentGame);

      const result = await setPlayerAnswerUseCase.execute(command);

      expect(result.data).toBeDefined();
    });
  });
});
