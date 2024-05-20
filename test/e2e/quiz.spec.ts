import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { SortDirections } from '../../src/domain/sorting-base-filter';
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
import { QuizQuestionsQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import { QuizGamesQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-games-query.filter';
import { mockGameData } from '../tools/models/game-mock-data';
import { SuperTestBody } from '../tools/models/body.response.model';
import { QuizQuestionViewType } from '../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-question.view-type';
import { QuizPairsRouting } from '../tools/routes/quizPairs.routing';

import { ApiRouting } from '../tools/routes/api.routing';

aDescribe(skipSettings.for('quiz'))('SAQuizController (e2e)', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let dataSource: DataSource;
  let httpServer: HttpServer;
  let quizQuestionRepository: Repository<QuizQuestion>;
  let quizAnswerRepository: Repository<QuizAnswer>;
  let quizGameRepository: Repository<QuizGame>;
  let quizTestManager: QuizTestManager;
  let apiRouting: ApiRouting;

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

    apiRouting = new ApiRouting();
    quizTestManager = new QuizTestManager(app, apiRouting);

    usersTestManager = settings.usersTestManager;
  });

  afterAll(async () => {
    // await cleanDatabase(httpServer);
    await app.close();
  });

  describe('GET /sa/quiz/questions', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      await quizTestManager.createQuestionsForFurtherTests(10);

      const numberOfPublishedQuestions = 6;
      const numberOfUnpublishedQuestions = 4;

      expect.setState({
        numberOfPublishedQuestions,
        numberOfUnpublishedQuestions,
      });
    });

    it('get all quiz questions with paging', async () => {
      const query: Partial<QuizQuestionsQueryFilter> = {
        bodySearchTerm: 'Question',
        publishedStatus: publishedStatuses.all,
        sortDirection: SortDirections.Asc,
        pageNumber: '1',
        pageSize: '10',
      };

      const questions = await quizTestManager.getQuestions(query);
      expect(questions.items).toHaveLength(10);
    });
    it('get published quiz questions with paging', async () => {
      const { numberOfPublishedQuestions } = expect.getState();
      const query: Partial<QuizQuestionsQueryFilter> = {
        bodySearchTerm: 'Question',
        publishedStatus: publishedStatuses.published,
        sortDirection: SortDirections.Asc,
        pageNumber: '1',
        pageSize: '10',
      };

      const questions = await quizTestManager.getQuestions(query);
      expect(questions.items).toHaveLength(numberOfPublishedQuestions);
    });
    it('get unpublished quiz questions with paging', async () => {
      const { numberOfUnpublishedQuestions } = expect.getState();
      const query: Partial<QuizQuestionsQueryFilter> = {
        bodySearchTerm: 'Question',
        publishedStatus: publishedStatuses.unpublished,
        sortDirection: SortDirections.Asc,
        pageNumber: '1',
        pageSize: '10',
      };

      const questions = await quizTestManager.getQuestions(query);
      expect(questions.items).toHaveLength(numberOfUnpublishedQuestions);
    });
  });

  describe('POST /sa/quiz/questions', () => {
    it(`Shouldn't create question with incorrect input model, 400`, async () => {});

    it(`Shouldn't create question without authorization, 400`, async () => {});

    it(`Should create question, 201`, async () => {
      const createdBody = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris'],
      };

      const question =
        await quizTestManager.createQuestionWithAnswers(createdBody);

      expect(question.body).toEqual(createdBody.body);
      expect(question.correctAnswers).toEqual(createdBody.correctAnswers);

      expect.setState({ question });
    });
  });

  describe('PUT /sa/quiz/questions/id', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('should update question and answers successfully', async () => {
      const { question } = expect.getState();

      const updatedBody = {
        body: 'Updated question text',
        correctAnswers: ['Updated answer 1', 'Updated answer 2'],
      };

      await quizTestManager.updateQuestion(question.id, updatedBody);

      const { answers, question: updatedQuestion } =
        await quizTestManager.getQuestionWithAnswers(question.id);

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

  describe('DELETE /sa/quiz/questions', () => {
    it('should delete question successfully', async () => {
      let questionId;

      await request(httpServer)
        .post(RouterPaths.quizQuestions)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send({
          body: 'Test question',
          correctAnswers: ['Answer 1', 'Answer 2'],
        })
        .expect(({ body }: SuperTestBody<QuizQuestionViewType>) => {
          expect(body).toBeDefined();
          questionId = body.id;
        })
        .expect(HttpStatus.CREATED);

      await request(httpServer)
        .delete(`${RouterPaths.quizQuestions}/${questionId}`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.NO_CONTENT);

      const { answers, question } =
        await quizTestManager.getQuestionWithAnswers(questionId);

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

  describe('PUT /sa/quiz/questions/id/publish', () => {
    beforeAll(async () => {
      const createdBody = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris'],
      };

      const question =
        await quizTestManager.createQuestionWithAnswers(createdBody);

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
  describe('POST/PUT/GET/ questions', () => {
    it('should create and publish 10 questions', async () => {
      await quizTestManager.createQuestions(10);
      const { items: questions } = await quizTestManager.getQuestions();

      questions.forEach((q) => {
        expect(q.published).toBeFalsy();
      });

      for (let i = 0; i < questions.length; i++) {
        await quizTestManager.publishQuestion(questions[i].id, {
          published: true,
        });
      }

      const { items: publishedQuestions } =
        await quizTestManager.getQuestions();

      publishedQuestions.forEach((q) => {
        expect(q.published).toBeTruthy();
      });
    });
  });

  describe('POST /pair-game-quiz/pairs/connection, GET /pair-game-quiz/pairs/my-current, /pair-game-quiz/pairs/:id', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const questionsAndAnswers =
        await quizTestManager.createQuestionsForFurtherTests(10);

      expect.setState({
        accessTokens,
        users,
        questionsAndAnswers,
      });
    });

    it("shouldn't create a new pair if unauthorized", async () => {
      await quizTestManager.createPairOrConnect(
        'accessTokens',
        HttpStatus.UNAUTHORIZED
      );
    });

    it('should create a new pair if no pending pairs available / try to connect and send answer, in both cases receive 403', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
        accessTokens[0]
      );

      await quizTestManager.createPairOrConnect(
        accessTokens[0],
        HttpStatus.FORBIDDEN
      );

      await quizTestManager.sendAnswer(
        accessTokens[0],
        'answer',
        HttpStatus.FORBIDDEN
      );

      expect(response.status).toBe('PendingSecondPlayer');
      expect(response.secondPlayerProgress).toBeNull();
    });

    it('should return 403 Forbidden if user is already in a game', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
        accessTokens[0],
        HttpStatus.FORBIDDEN
      );

      expect(response.error).toBe('User already in active game');
    });

    it('POST /pair-game-quiz/pairs/connection - should connect user to an existing pair if available', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
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

      await quizTestManager.getCurrentUnfinishedGame(
        accessTokens[2],
        HttpStatus.NOT_FOUND
      );

      await quizTestManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN
      );
    });

    it('POST /pair-game-quiz/pairs/connection - should not connect is pair already created, and create new game pair in status pending, 200', async () => {
      const { accessTokens } = expect.getState();

      const createdGame = await quizTestManager.createPairOrConnect(
        accessTokens[2]
      );

      expect(createdGame.status).toBe(GameStatus.PendingSecondPlayer);
      expect(createdGame.secondPlayerProgress).toBeNull();
      expect(createdGame.questions).toBeNull();
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if game not found, 404', async () => {
      let { accessTokens, gameId } = expect.getState();
      let correctGameIdButNotExists = gameId.slice(0, -2) + '00';

      const response = await quizTestManager.getCurrentGameById(
        accessTokens[0],
        correctGameIdButNotExists,
        HttpStatus.NOT_FOUND
      );

      expect(response.error).toBe('Game not found');
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if unauthorized, 401', async () => {
      const { gameId } = expect.getState();

      await quizTestManager.getCurrentGameById(
        'accessTokens',
        gameId,
        HttpStatus.UNAUTHORIZED
      );
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if user not participant, 403', async () => {
      const { accessTokens, gameId } = expect.getState();

      const response = await quizTestManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN
      );

      expect(response.error).toBe('Current user is not a participant');
    });

    it('GET /pair-game-quiz/pairs/:id - receive current pair, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const gameByFirstPlayer = await quizTestManager.getCurrentGameById(
        accessTokens[0],
        gameId
      );

      const gameBySecondPlayer = await quizTestManager.getCurrentGameById(
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
      await quizTestManager.getCurrentUnfinishedGame(
        'accessToken',
        HttpStatus.UNAUTHORIZED
      );
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive current game info, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const game = await quizTestManager.getCurrentUnfinishedGame(
        accessTokens[0]
      );
      const theSameGame = await quizTestManager.getCurrentUnfinishedGame(
        accessTokens[1]
      );

      expect(game.id).toBe(theSameGame.id);

      await quizTestManager.restoreGameProgress(gameId);
    });
  });
  describe.only('GET /pair-game-quiz/pairs/my-statistic / my', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer)
      
      const { accessTokens } = await usersTestManager.createUsers(4);

      const [
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      ] = accessTokens;

      console.log({
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      });

      await quizTestManager.simulateFinishedGames(accessTokens, 10);

      expect.setState({
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      });
    });

    it('testing', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      } = expect.getState();

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const firstPlayerGames =
        await quizTestManager.getMyGames(firstPlayerToken);

      console.log(firstPlayerGames.items);
    });

    it.skip('GET /pair-game-quiz/pairs/my', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      } = expect.getState();

      const query: QuizGamesQueryFilter = {
        pageNumber: '1',
        sortBy: 'createdAt',
        sortDirection: SortDirections.Desc,
        pageSize: '10',
      };

      const firstPlayerGames =
        await quizTestManager.getMyGames(firstPlayerToken);
      const games = firstPlayerGames.items;
      console.log({ games });

      expect(firstPlayerGames.totalCount).toBe(games.length);

      games.forEach((game, i) => {
        expect(game.status).toBe(GameStatus.Finished);
        expect(game).toEqual(mockGameData);
        expect(game.questions).toHaveLength(5);
        expect(
          game.firstPlayerProgress.answers && game.secondPlayerProgress.answers
        ).toHaveLength(5);

        expect(game.firstPlayerProgress.answers[i].questionId).toBe(
          game.questions[i].id
        );
      });

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      await quizTestManager.createPairOrConnect(thirdPlayerToken);

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      }
      const unfinishedGame =
        await quizTestManager.getCurrentUnfinishedGame(thirdPlayerToken);
      const unfinishedGameById = await quizTestManager.getCurrentGameById(
        thirdPlayerToken,
        unfinishedGame.id
      );

      unfinishedGame.firstPlayerProgress.answers.forEach((a, i) => {
        expect(a.questionId).toBe(unfinishedGame.questions[i].id);

        expect(
          unfinishedGameById.firstPlayerProgress.answers[i].questionId
        ).toBe(unfinishedGameById.questions[i].id);
      });

      const checkGamesSorting =
        quizTestManager.checkConsistencyOfDataSorting(games);

      await quizTestManager.getMyGames(secondPlayerToken);
      await quizTestManager.getMyGames(thirdPlayerToken);
      await quizTestManager.getMyGames(fourthPlayerToken);
    });
  });
  describe('POST /pair-game-quiz/pairs/my-current/answers; pair-game-quiz.controller,', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const questionsAndAnswers =
        await quizTestManager.createQuestionsForFurtherTests(10);

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
        await quizTestManager.prepareForBattle(
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

      await quizTestManager.sendAnswer(
        accessTokens[2],
        answer,
        HttpStatus.FORBIDDEN
      );
    });

    it('POST /pair-game-quiz/pairs/incorrect_id_format - should receive BAD_REQUEST if param has incorrect format, 400', async () => {
      const { firstPlayerToken } = expect.getState();
      const incorrectGameId = 'incorrect_id_format';

      await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        incorrectGameId,
        HttpStatus.BAD_REQUEST
      );
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should not send answer if current user is unauthorized, 401', async () => {
      const answer = 'answer';

      await quizTestManager.sendAnswer(
        'accessToken',
        answer,
        HttpStatus.UNAUTHORIZED
      );
    });

    it('POST /pair-game-quiz/pairs/my-current/answers -  sending incorrect answers by different players, 200', async () => {
      const { firstPlayerToken, secondPlayerToken, gameId } = expect.getState();

      const incorrectAnswer = 'incorrect answer';

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, incorrectAnswer);

        await quizTestManager.sendAnswer(secondPlayerToken, incorrectAnswer);
      }

      const gameAfterFinish = await quizTestManager.getCurrentGameById(
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

      await quizTestManager.sendAnswer(
        firstPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );

      await quizTestManager.restoreGameProgress(gameId);
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
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx]
        );
      }

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );
      await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      await quizTestManager.getCurrentUnfinishedGame(firstPlayerToken);
      await quizTestManager.getCurrentUnfinishedGame(secondPlayerToken);

      expect(game.firstPlayerProgress.score).toBe(5);
      expect(game.status).toBe(GameStatus.Active);
      expect(game.firstPlayerProgress.answers[0].answerStatus).toBe(
        AnswerStatus.Correct
      );

      game.firstPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
      });

      await quizTestManager.restoreGameProgress(gameId);
    });

    it('POST /pair-game-quiz/pairs/my-current/answers -  sending answer both players; first player all answers correct, second player only 1 first correct, 200', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      await quizTestManager.getCurrentUnfinishedGame(
        thirdPlayerToken,
        HttpStatus.NOT_FOUND
      );

      await quizTestManager.getCurrentGameById(
        thirdPlayerToken,
        gameId,
        HttpStatus.FORBIDDEN
      );

      for (let i = 0; i < 5; i++) {
        //@ts-ignore
        const answerIdx = i & (0b1 === 1);
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx]
        );

        const game = await quizTestManager.getCurrentGameById(
          firstPlayerToken,
          gameId
        );

        await quizTestManager.sendAnswer(
          secondPlayerToken,
          correctAnswersForCurrentGame[i]
        );

        expect(game.firstPlayerProgress.score).toBe(1 + i);
      }

      await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
        HttpStatus.OK
      );

      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );

      expect(game.firstPlayerProgress.score).toBe(6);
      expect(game.secondPlayerProgress.score).toBe(1);
      expect(game.status).toBe(GameStatus.Finished);
      expect(game.finishGameDate).toBeDefined();

      await quizTestManager.restoreGameProgress(gameId);
    });
    it('POST /pair-game-quiz/pairs/my-current/answers -  sending answer both players; first and second player get all correct answers, but secondPlayer finished earlier', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      for (let i = 0; i < 5; i++) {
        //@ts-ignore
        const answerIdx = i & (0b1 === 1);

        await quizTestManager.sendAnswer(
          secondPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx]
        );

        const game = await quizTestManager.getCurrentGameById(
          secondPlayerToken,
          gameId
        );

        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[2 * (i + 1) - 1]
        );

        expect(game.firstPlayerProgress.score).toBe(i);
        expect(game.secondPlayerProgress.score).toBe(i + 1);
      }

      await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );
      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );
      const gameBySecondPlayer = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId
      );

      game.firstPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
        expect(game.secondPlayerProgress.answers[i].questionId).toBe(
          game.questions[i].id
        );
      });

      gameBySecondPlayer.firstPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
      });

      expect(game.status).toBe(GameStatus.Finished);
      expect(game.firstPlayerProgress.score).toBe(5);
      expect(game.secondPlayerProgress.score).toBe(6);

      // await quizTestManager.restoreGameProgress(gameId, true);
    });

    it('GET /pair-game-quiz/pairs/my - should return all user games', async () => {
      const { firstPlayerToken, secondPlayerToken } = expect.getState();

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const result =
        await quizTestManager.createPairOrConnect(secondPlayerToken);
      const game = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        result.id
      );

      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

      const newGame =
        await quizTestManager.getCurrentUnfinishedGame(firstPlayerToken);

      const query: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'defaultSortBy',
        sortDirection: SortDirections.Asc,
      };
      const games = await quizTestManager.getMyGames(firstPlayerToken, query);

      expect(games.totalCount).toBeDefined();
    });
  });

  describe('CONSTANT TESTS', () => {
    beforeEach(async () => {
      await cleanDatabase(httpServer);

      const questionsAndAnswers =
        await quizTestManager.createQuestionsForFurtherTests(10);

      const { accessTokens } = await usersTestManager.createUsers(3);

      const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] =
        accessTokens;

      expect.setState({
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      });
    });

    // it.only('', async () => {
    //   const { firstPlayerToken, secondPlayerToken, thirdPlayerToken } =
    //     expect.getState();

    //   console.log({
    //     firstPlayerToken,
    //     secondPlayerToken,
    //     thirdPlayerToken,
    //   });
    // });

    it('testing', async () => {
      const { firstPlayerToken, secondPlayerToken, thirdPlayerToken } =
        expect.getState();
      // await cleanDatabase(httpServer);

      // const questionsAndAnswers =
      //   await quizTestManager.createQuestionsForFurtherTests(10);

      // const { accessTokens } = await usersTestManager.createUsers(3);

      // const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] =
      //   accessTokens;

      const game = await quizTestManager.createPairOrConnect(firstPlayerToken);
      const fault = await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN
      );

      await quizTestManager.createPairOrConnect(secondPlayerToken);

      const gameId = game.id;

      await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN
      );
      await quizTestManager.createPairOrConnect(
        secondPlayerToken,
        HttpStatus.FORBIDDEN
      );

      console.log({ firstPlayerToken, secondPlayerToken, thirdPlayerToken });

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );

      const finishedGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId
      );

      expect(finishedGame.status).toBe(GameStatus.Finished);

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const { id: newGameId } =
        await quizTestManager.createPairOrConnect(secondPlayerToken);

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      const newGame = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        newGameId
      );

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const { id: newGameId2 } =
        await quizTestManager.createPairOrConnect(secondPlayerToken);

      for (let i = 0; i < 4; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      const newGame2 = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        newGameId2
      );

      await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN
      );
      await quizTestManager.createPairOrConnect(
        secondPlayerToken,
        HttpStatus.FORBIDDEN
      );

      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

      await quizTestManager.sendAnswer(secondPlayerToken, 'answer');

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      await quizTestManager.createPairOrConnect(secondPlayerToken);

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }
      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );
      await quizTestManager.sendAnswer(
        firstPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );

      expect.setState({ firstPlayerToken, secondPlayerToken });
    });
    it('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": add answers to first game, created by user1, connected by user2: add incorrect answer by firstPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; get active game and call "/pair-game-quiz/pairs/my-current by both users after each answer"; status 200;', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();
      console.log({ firstPlayerToken, secondPlayerToken });

      await quizTestManager.createPairOrConnect(secondPlayerToken);

      const firstPair =
        await quizTestManager.createPairOrConnect(firstPlayerToken);

      const { correctAnswersForCurrentGame: answers } =
        await quizTestManager.getCorrectAnswersForGame(
          firstPair.id,
          questionsAndAnswers
        );

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, answers[i + 1]);

        await quizTestManager.sendAnswer(secondPlayerToken, answers[i]);
      }

      await quizTestManager.createPairOrConnect(secondPlayerToken);
      await quizTestManager.createPairOrConnect(firstPlayerToken);

      for (let i = 0; i < 4; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, answers[i]);
        await quizTestManager.getCurrentUnfinishedGame(firstPlayerToken);
        await quizTestManager.sendAnswer(secondPlayerToken, answers[i + 1]);
        await quizTestManager.getCurrentUnfinishedGame(secondPlayerToken);
      }
      await quizTestManager.sendAnswer(
        firstPlayerToken,
        answers[answers.length - 1]
      );
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        answers[answers.length - 1]
      );

      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND
      );

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      // const game = await quizTestManager.createPairOrConnect(secondPlayerToken);

      // await quizTestManager.getCurrentGameById(secondPlayerToken, game.id);
      // await quizTestManager.getCurrentGameById(firstPlayerToken, game.id);

      await quizTestManager.sendAnswer(
        thirdPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN
      );
      const firstPlayerStats =
        await quizTestManager.getMyGames(firstPlayerToken);
      expect(firstPlayerStats.totalCount).toBe(3);

      // await quizUserManager.getStatistics(firstPlayerToken)
    });
    it.skip('GET STATS', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();

      const firstPlayerStats =
        await quizTestManager.getMyGames(firstPlayerToken);
      console.log({ firstPlayerStats: firstPlayerStats.items });

      // const secondPlayerStats = await quizTestManager.getMyGames(secondPlayerToken)
      // console.log({firstPlayerStats, secondPlayerStats});
    });
    it.skip('GET /pair-game-quiz/pairs/my - should return all user games', async () => {
      const { firstPlayerToken } = expect.getState();

      const query: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'defaultSortBy',
        sortDirection: SortDirections.Asc,
      };
      const games = await quizTestManager.getMyGames(firstPlayerToken, query);
      // console.log(games.items);

      expect(games.totalCount).toBe(2);
    });
  });
});
