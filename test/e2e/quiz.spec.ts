import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { SortDirections } from '../../src/domain/sorting-base-filter';
import { QuizQuestionsQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import {
  AnswerStatus,
  GameStatus,
  publishedStatuses,
} from '../../src/features/quiz/api/models/input.models/statuses.model';
import { EmailManager } from '../../src/infra/managers/email-manager';
import { QuizAnswer, QuizGame, QuizQuestion } from '../../src/settings';
import { EmailManagerMock } from '../tools/dummies/email.manager.mock';
import { NavigationEnum, RouterPaths } from '../tools/helpers/routing';
import { QuizTestManager } from '../tools/managers/QuizTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { wait } from '../tools/utils/delayUtils';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';

aDescribe(skipSettings.for('quiz'))('SAQuizController (e2e)', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let dataSource: DataSource;
  let httpServer: HttpServer;
  let quizQuestionRepository: Repository<QuizQuestion>;
  let quizAnswerRepository: Repository<QuizAnswer>;
  let quizGameRepository: Repository<QuizGame>;
  let quizQuestionManager: QuizTestManager;
  let quizPairManager: QuizTestManager;

  beforeAll(async () => {
    const settings = await initSettings((moduleBuilder) =>
      moduleBuilder.overrideProvider(EmailManager).useClass(EmailManagerMock)
    );
    app = settings.app;
    httpServer = settings.httpServer;
    dataSource = settings.testingAppModule.get(DataSource);

    // cut out
    quizQuestionRepository = app.get(getRepositoryToken(QuizQuestion));
    quizAnswerRepository = app.get(getRepositoryToken(QuizAnswer));
    quizGameRepository = app.get(getRepositoryToken(QuizGame));

    quizQuestionManager = new QuizTestManager(
      app,
      NavigationEnum.quizQuestions
    );
    quizPairManager = new QuizTestManager(app, NavigationEnum.quizPairs);
    usersTestManager = settings.usersTestManager;
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  describe.skip('GET /sa/quiz/questions', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('', async () => {
      const filter: QuizQuestionsQueryFilter = {
        bodySearchTerm: 'Question',
        publishedStatus: publishedStatuses.all,
        sortBy: 'createdAt',
        sortDirection: SortDirections.Asc,
        pageNumber: '1',
        pageSize: '10',
      };

      await quizQuestionManager.createQuestionsForFurtherTests(3);

      const questions = await quizQuestionManager.getQuestions(filter);
    });
  });

  describe.skip('POST /sa/quiz/questions', () => {
    it(`Shouldn't create question with incorrect input model, 400`, async () => {});

    it(`Shouldn't create question without authorization, 400`, async () => {});

    it(`Should create question, 201`, async () => {
      const createdBody = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris'],
      };

      const question =
        await quizQuestionManager.createQuestionWithAnswers(createdBody);

      expect(question.body).toEqual(createdBody.body);
      expect(question.correctAnswers).toEqual(createdBody.correctAnswers);

      expect.setState({ question });
    });
  });

  describe.skip('PUT /sa/quiz/questions/id', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('should update question and answers successfully', async () => {
      const { question } = expect.getState();

      const updatedBody = {
        body: 'Updated question text',
        correctAnswers: ['Updated answer 1', 'Updated answer 2'],
      };

      await quizQuestionManager.updateQuestion(question.id, updatedBody);

      const { answers, question: updatedQuestion } =
        await quizQuestionManager.getQuestionWithAnswers(question.id);

      expect(updatedQuestion.body).toBe(updatedBody.body);
      expect(answers.map((answer) => answer.answerText)).toEqual(
        updatedBody.correctAnswers
      );
    });

    it('should return 404 if question not found', async () => {
      const questionId = 'invalid_id';

      await request(httpServer)
        .put(`${RouterPaths.quizQuestions}/${questionId}`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send({ body: 'Updated question text', correctAnswers: ['Answer 1'] })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 if question is published and correct answers are not provided', async () => {
      const { question } = expect.getState();

      const updatedBody = {
        body: 'Updated question text',
        correctAnswers: [],
      };

      const updateQuery = `
        UPDATE quiz_question
        SET published = true
        WHERE id = $1;
      `;

      await dataSource.query(updateQuery, [question.id]);

      await request(httpServer)
        .put(`${RouterPaths.quizQuestions}/${question.id}`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(updatedBody)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe.skip('DELETE /sa/quiz/questions', () => {
    it('should delete question successfully', async () => {
      const response = await request(httpServer)
        .post('/sa/quiz/questions')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send({
          body: 'Test question',
          correctAnswers: ['Answer 1', 'Answer 2'],
        });

      const { id } = response.body;

      await request(httpServer)
        .delete(`/sa/quiz/questions/${id}`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.NO_CONTENT);

      const { answers, question } =
        await quizQuestionManager.getQuestionWithAnswers(id);

      expect(answers.length).toBe(0);
      expect(question).toBeNull();
    });

    it('should return 404 if question does not exist', async () => {
      await request(httpServer)
        .delete(`/sa/quiz/questions/nonexistent-id`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 if not provide authorization', async () => {
      await request(httpServer)
        .delete(`/sa/quiz/questions/nonexistent-id`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe.skip('PUT /sa/quiz/questions/id/publish', () => {
    beforeAll(async () => {
      const createdBody = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris'],
      };

      const question =
        await quizQuestionManager.createQuestionWithAnswers(createdBody);

      expect.setState({ question });
    });

    it('should throw bad request if input request published is false', async () => {
      const { question } = expect.getState();
      const body = { published: false };

      await request(httpServer)
        .put(`/sa/quiz/questions/${question.id}/publish`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should publish question successfully', async () => {
      const { question } = expect.getState();
      const body = { published: true };

      await request(httpServer)
        .put(`/sa/quiz/questions/${question.id}/publish`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(body)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should throw bad request if the question is already published', async () => {
      const { question } = expect.getState();
      const body = { published: true };

      await request(httpServer)
        .put(`/sa/quiz/questions/${question.id}/publish`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // beforeEach(async () => {
  //   const { accessTokens, users } = await usersTestManager.createUsers(3);

  //   const questionsAndAnswers =
  //     await quizQuestionManager.createQuestionsForFurtherTests(10);

  //   expect.setState({
  //     accessTokens,
  //     users,
  //     questionsAndAnswers,
  //   });
  // });

  describe('POST /pair-game-quiz/pairs/connection, GET /pair-game-quiz/pairs/my-current, /pair-game-quiz/pairs/:id', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const questionsAndAnswers =
        await quizQuestionManager.createQuestionsForFurtherTests(10);

      expect.setState({
        accessTokens,
        users,
        questionsAndAnswers,
      });
    });

    it("shouldn't create a new pair if unauthorized", async () => {
      await quizPairManager.createPairOrConnect(
        'accessTokens',
        HttpStatus.UNAUTHORIZED
      );
    });

    it('should create a new pair if no pending pairs available', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizPairManager.createPairOrConnect(
        accessTokens[0]
      );

      expect(response.status).toBe('PendingSecondPlayer');
      expect(response.secondPlayerProgress).toBeNull();
    });

    it('should return 403 Forbidden if user is already in a game', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizPairManager.createPairOrConnect(
        accessTokens[0],
        HttpStatus.FORBIDDEN
      );

      expect(response.error).toBe('User already in game');
    });

    it('POST /pair-game-quiz/pairs/connection - should connect user to an existing pair if available', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizPairManager.createPairOrConnect(
        accessTokens[1]
      );

      const gameId = response.id;

      expect(response.status).toBe(GameStatus.Active);
      expect(response.secondPlayerProgress).not.toBeNull();
      expect(response.questions).toHaveLength(5);

      expect.setState({ gameId });
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive error if current player have no active pairs, 404', async () => {
      const { accessTokens, gameId } = expect.getState();

      await quizPairManager.getCurrentUnfinishedGame(
        accessTokens[2],
        HttpStatus.NOT_FOUND
      );

      await quizPairManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN
      );
    });

    it('POST /pair-game-quiz/pairs/connection - should not connect is pair already created, and create new game pair in status pending, 200', async () => {
      const { accessTokens } = expect.getState();

      const createdGame = await quizPairManager.createPairOrConnect(
        accessTokens[2]
      );

      expect(createdGame.status).toBe(GameStatus.PendingSecondPlayer);
      expect(createdGame.secondPlayerProgress).toBeNull();
      expect(createdGame.questions).toBeNull();
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if game not found, 404', async () => {
      let { accessTokens, gameId } = expect.getState();
      const correctGameIdByNotExists = gameId.slice(0, -1);

      const response = await quizPairManager.getCurrentGameById(
        accessTokens[0],
        correctGameIdByNotExists + 1,
        HttpStatus.NOT_FOUND
      );

      expect(response.error).toBe('Game not found');
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if unauthorized, 401', async () => {
      const { gameId } = expect.getState();

      await quizPairManager.getCurrentGameById(
        'accessTokens',
        gameId,
        HttpStatus.UNAUTHORIZED
      );
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if user not participant, 403', async () => {
      const { accessTokens, gameId } = expect.getState();

      const response = await quizPairManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN
      );

      expect(response.error).toBe('Current user is not a participant');
    });

    it('GET /pair-game-quiz/pairs/:id - receive current pair, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const gameByFirstPlayer = await quizPairManager.getCurrentGameById(
        accessTokens[0],
        gameId
      );

      const gameBySecondPlayer = await quizPairManager.getCurrentGameById(
        accessTokens[1],
        gameId
      );

      expect(gameByFirstPlayer.firstPlayerProgress.player.login).toBe('login0');
      expect(gameBySecondPlayer.secondPlayerProgress.player.login).toBe(
        'login1'
      );
      expect(gameByFirstPlayer.id).toBe(gameBySecondPlayer.id);
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive error with invalid token, 401', async () => {
      await quizPairManager.getCurrentUnfinishedGame(
        'accessToken',
        HttpStatus.UNAUTHORIZED
      );
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive current game info, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const game = await quizPairManager.getCurrentUnfinishedGame(
        accessTokens[0]
      );
      const theSameGame = await quizPairManager.getCurrentUnfinishedGame(
        accessTokens[1]
      );

      expect(game.id).toBe(theSameGame.id);

      await quizPairManager.restoreGameProgress(gameId);
    });
  });

  describe('POST /pair-game-quiz/pairs/my-current/answers; pair-game-quiz.controller,', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const questionsAndAnswers =
        await quizQuestionManager.createQuestionsForFurtherTests(10);

      expect.setState({
        accessTokens,
        users,
        questionsAndAnswers,
      });
    });
    it('prepare for battle', async () => {
      const { accessTokens, questionsAndAnswers } = expect.getState();

      const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] =
        accessTokens;

      const { correctAnswersForCurrentGame, gameId } =
        await quizPairManager.prepareForBattle(
          firstPlayerToken,
          secondPlayerToken,
          questionsAndAnswers
        );

      expect.setState({
        gameId,
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        correctAnswersForCurrentGame,
      });
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should not send answer if current user is not inside active pair, 403', async () => {
      const { accessTokens } = expect.getState();
      const answer = 'answer';

      await quizPairManager.sendAnswer(
        accessTokens[2],
        answer,
        HttpStatus.FORBIDDEN
      );
    });

    it('POST /pair-game-quiz/pairs/incorrect_id_format - should receive BAD_REQUEST if param has incorrect format, 400', async () => {
      const { firstPlayerToken } = expect.getState();
      const incorrectGameId = 'incorrect_id_format';

      await quizPairManager.getCurrentGameById(
        firstPlayerToken,
        incorrectGameId,
        HttpStatus.BAD_REQUEST
      );
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should not send answer if current user is unauthorized, 401', async () => {
      const answer = 'answer';

      await quizPairManager.sendAnswer(
        'accessToken',
        answer,
        HttpStatus.UNAUTHORIZED
      );
    });

    it('POST /pair-game-quiz/pairs/my-current/answers -  sending incorrect answers by different players, 200', async () => {
      const { firstPlayerToken, secondPlayerToken, gameId } = expect.getState();

      const incorrectAnswer = 'incorrect answer';

      for (let i = 0; i < 5; i++) {
        await quizPairManager.sendAnswer(firstPlayerToken, incorrectAnswer);

        await quizPairManager.sendAnswer(secondPlayerToken, incorrectAnswer);
      }

      const gameAfterFinish = await quizPairManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );

      expect(gameAfterFinish.status).toBe(GameStatus.Finished);
      expect(gameAfterFinish.questions).toHaveLength(5);
      expect(gameAfterFinish.firstPlayerProgress.answers).toHaveLength(5);
      expect(gameAfterFinish.firstPlayerProgress.score).toBe(0);
      expect(gameAfterFinish.secondPlayerProgress.answers).toHaveLength(5);
      expect(gameAfterFinish.secondPlayerProgress.score).toBe(0);
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should receive error if give more than 5 answers, 403', async () => {
      const { firstPlayerToken, secondPlayerToken, gameId } = expect.getState();

      await wait(5);

      await quizPairManager.sendAnswer(
        firstPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );

      await quizPairManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );

      await quizPairManager.restoreGameProgress(gameId);
    });

    it('POST /pair-game-quiz/pairs/my-current/answers -  sending correct answers, 200', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        gameId,
        correctAnswersForCurrentGame,
      } = expect.getState();

      for (let i = 0; i < correctAnswersForCurrentGame.length / 2; i++) {
        //@ts-ignore
        const answerIdx = i & (0b1 === 1);
        await quizPairManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx]
        );
      }

      const game: QuizGame = await quizPairManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );

      const game1 =
        await quizPairManager.getCurrentUnfinishedGame(firstPlayerToken);


      expect(game.firstPlayerProgress.score).toBe(5);
      expect(game.status).toBe(GameStatus.Active);
      expect(game.firstPlayerProgress.answers[0].answerStatus).toBe(
        AnswerStatus.Correct
      );
      // game.firstPlayerProgress.answers.forEach((answer, i) => {
      //   expect(answer.questionId).toBe(game.questions[i].id);
      // });

      await quizPairManager.restoreGameProgress(gameId);
    });

    it('POST /pair-game-quiz/pairs/my-current/answers -  sending answer both players; first player all answers correct, second player only 1 first correct, 200', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      await quizPairManager.getCurrentUnfinishedGame(
        thirdPlayerToken,
        HttpStatus.NOT_FOUND
      );

      await quizPairManager.getCurrentGameById(
        thirdPlayerToken,
        gameId,
        HttpStatus.FORBIDDEN
      );

      for (let i = 0; i < correctAnswersForCurrentGame.length / 2; i++) {
        //@ts-ignore
        const answerIdx = i & (0b1 === 1);
        await quizPairManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx]
        );

        const game = await quizPairManager.getCurrentGameById(
          firstPlayerToken,
          gameId
        );

        await quizPairManager.sendAnswer(
          secondPlayerToken,
          correctAnswersForCurrentGame[i]
        );

        expect(game.firstPlayerProgress.score).toBe(1 + i);
      }

      await quizPairManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
        HttpStatus.OK
      );

      await quizPairManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );

      const game: QuizGame = await quizPairManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );

      expect(game.firstPlayerProgress.score).toBe(6);
      expect(game.secondPlayerProgress.score).toBe(1);
      expect(game.status).toBe(GameStatus.Finished);
      expect(game.finishGameDate).toBeDefined();

      await quizPairManager.restoreGameProgress(gameId, true);
    });

    it('/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current" : create game by user2, connect to the game by user1, then: add correct answer by firstPlayer; add incorrect answer by secondPlayer; add correct answer by secondPlayer; get active game and call "/pair-game-quiz/pairs/my-current by both users after each answer"; status 200', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        questionsAndAnswers,
        thirdPlayerToken,
      } = expect.getState();

      const { correctAnswersForCurrentGame, gameId } =
        await quizPairManager.prepareForBattle(
          firstPlayerToken,
          secondPlayerToken,
          questionsAndAnswers
        );

      await quizPairManager.sendAnswer(
        firstPlayerToken,
        correctAnswersForCurrentGame[0]
      );

      await quizPairManager.sendAnswer(secondPlayerToken, 'incorrectAnswer');

      expect.setState({ correctAnswersForCurrentGame, gameId });
    });
  });
  describe.skip('TEST', () => {
    it('GET QUESTIONS', async () => {
      await quizQuestionManager.getQuestions();
    });
  });
});
