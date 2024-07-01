import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { SortDirections } from '../../src/domain/sorting-base-filter';
import { QuizGamesQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-games-query.filter';
import { QuizQuestionsQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import {
  AnswerStatus,
  GameStatus,
  publishedStatuses,
} from '../../src/features/quiz/api/models/input.models/statuses.model';
import { PlayerStatsView } from '../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game-analyze';
import { QuizPairViewType } from '../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizQuestionViewType } from '../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-question.view-type';
import { EmailManager } from '../../src/infra/managers/email-manager';
import { QuizGame } from '../../src/settings';
import { EmailManagerMock } from '../tools/dummies/email.manager.mock';
import { RouterPaths } from '../tools/helpers/routing';
import { QuizTestManager } from '../tools/managers/QuizTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { SuperTestBody } from '../tools/models/body.response.model';
import { mockGameData } from '../tools/models/game-mock-data';
import { ApiRouting } from '../tools/routes/api.routing';
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
  let quizTestManager: QuizTestManager;
  let apiRouting: ApiRouting;

  beforeAll(async () => {
    const settings = await initSettings((moduleBuilder) =>
      moduleBuilder.overrideProvider(EmailManager).useClass(EmailManagerMock),
    );
    app = settings.app;
    httpServer = settings.httpServer;
    dataSource = settings.testingAppModule.get(DataSource);

    apiRouting = new ApiRouting();
    quizTestManager = new QuizTestManager(app, apiRouting);

    usersTestManager = settings.usersTestManager;
  });
  describe('testing questions', () => {
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
      it(`Shouldn't create question with incorrect input model, 400`, async () => {
        await quizTestManager.createQuestion(
          { body: '', correctAnswers: [] },
          HttpStatus.BAD_REQUEST,
        );
      });

      it(`Shouldn't create question with incorrect format answers in array of answers, 400`, async () => {
        await quizTestManager.createQuestion(
          { body: 'questions body', correctAnswers: ['answer0', 1, 'answer1'] },
          HttpStatus.BAD_REQUEST,
        );
      });

      it(`Should create question, 201`, async () => {
        const createdBody = {
          body: 'What is the capital of France?',
          correctAnswers: ['Paris', 'paris'],
        };

        const question = await quizTestManager.createQuestionWithAnswers(
          createdBody,
        );

        expect(question.body).toEqual(createdBody.body);
        expect(question.correctAnswers).toEqual(createdBody.correctAnswers);

        expect.setState({ question, createdBody });
      });

      it(`Shouldn't create question without authorization, 401`, async () => {
        const authorized = false;
        const { createdBody } = expect.getState();
        await quizTestManager.createQuestion(
          createdBody,
          HttpStatus.UNAUTHORIZED,
          authorized,
        );
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
          updatedBody.correctAnswers,
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

        const question = await quizTestManager.createQuestionWithAnswers(
          createdBody,
        );

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
      it('get quiz questions with paging', async () => {
        await quizTestManager.createAndPublishQuestions(10);
        const query: Partial<QuizQuestionsQueryFilter> = {
          bodySearchTerm: 'Question',
          publishedStatus: publishedStatuses.unpublished,
          sortDirection: SortDirections.Asc,
          pageNumber: '1',
          pageSize: '100',
        };

        const questions = await quizTestManager.getQuestions();

        expect(questions.totalCount).toBe(21);
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
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should create a new pair if no pending pairs available / try to connect and send answer, in both cases receive 403', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
        accessTokens[0],
      );

      await quizTestManager.createPairOrConnect(
        accessTokens[0],
        HttpStatus.FORBIDDEN,
      );

      await quizTestManager.sendAnswer(
        accessTokens[0],
        'answer',
        HttpStatus.FORBIDDEN,
      );

      expect(response.status).toBe('PendingSecondPlayer');
      expect(response.secondPlayerProgress).toBeNull();
    });

    it('should return 403 Forbidden if user is already in a game', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
        accessTokens[0],
        HttpStatus.FORBIDDEN,
      );

      expect(response.error).toBe('User already in active game');
    });

    it('POST /pair-game-quiz/pairs/connection - should connect user to an existing pair if available', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizTestManager.createPairOrConnect(
        accessTokens[1],
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
        HttpStatus.NOT_FOUND,
      );

      await quizTestManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN,
      );
    });

    it('POST /pair-game-quiz/pairs/connection - should not connect is pair already created, and create new game pair in status pending, 200', async () => {
      const { accessTokens } = expect.getState();

      const createdGame = await quizTestManager.createPairOrConnect(
        accessTokens[2],
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
        HttpStatus.NOT_FOUND,
      );

      expect(response.error).toBe('Game not found');
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if unauthorized, 401', async () => {
      const { gameId } = expect.getState();

      await quizTestManager.getCurrentGameById(
        'accessTokens',
        gameId,
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('GET /pair-game-quiz/pairs/:id - should receive error if user not participant, 403', async () => {
      const { accessTokens, gameId } = expect.getState();

      const response = await quizTestManager.getCurrentGameById(
        accessTokens[2],
        gameId,
        HttpStatus.FORBIDDEN,
      );

      expect(response.error).toBe('Current user is not a participant');
    });

    it('GET /pair-game-quiz/pairs/:id - receive current pair, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const gameByFirstPlayer = await quizTestManager.getCurrentGameById(
        accessTokens[0],
        gameId,
      );

      const gameBySecondPlayer = await quizTestManager.getCurrentGameById(
        accessTokens[1],
        gameId,
      );

      expect(gameByFirstPlayer.firstPlayerProgress.player.login).toBe('login0');
      expect(gameBySecondPlayer.secondPlayerProgress.player.login).toBe(
        'login1',
      );
      expect(gameByFirstPlayer.id).toBe(gameBySecondPlayer.id);
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive error with invalid token, 401', async () => {
      await quizTestManager.getCurrentUnfinishedGame(
        'accessToken',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('GET /pair-game-quiz/pairs/my-current - should receive current game info, 200', async () => {
      const { accessTokens, gameId } = expect.getState();

      const game = await quizTestManager.getCurrentUnfinishedGame(
        accessTokens[0],
      );
      const theSameGame = await quizTestManager.getCurrentUnfinishedGame(
        accessTokens[1],
      );

      expect(game.id).toBe(theSameGame.id);

      await quizTestManager.restoreGameProgress(gameId);
    });
  });
  describe('GET /pair-game-quiz/pairs/my', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens } = await usersTestManager.createUsers(4);

      const [
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      ] = accessTokens;

      // console.log({
      //   firstPlayerToken,
      //   secondPlayerToken,
      //   thirdPlayerToken,
      //   fourthPlayerToken,
      // });

      const numberOfGamesCreated = 10;
      await quizTestManager.simulateFinishedGames(
        accessTokens,
        numberOfGamesCreated,
      );

      expect.setState({
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      });
    });

    it(`GET /pair-game-quiz/pairs/my; testing validate data consistency and order of finished firstPlayer's games`, async () => {
      const { firstPlayerToken } = expect.getState();

      const firstPlayerGames = await quizTestManager.getMyGames(
        firstPlayerToken,
      );

      const games = firstPlayerGames.items;

      const checkDefaultGameSorting =
        quizTestManager.checkConsistencyOfDataSorting(games);

      expect(firstPlayerGames.totalCount).toBe(games.length);

      games.forEach((game, i) => {
        expect(game.status).toBe(GameStatus.Finished);
        expect(game).toEqual(mockGameData);

        expect(
          game.questions &&
            game.firstPlayerProgress.answers &&
            game.secondPlayerProgress.answers,
        ).toHaveLength(5);

        expect(game.firstPlayerProgress.answers[i].questionId).toBe(
          game.questions[i].id,
        );
      });
    });

    it(`GET /pair-game-quiz/pairs/my; validate data consistency and order of finished and pending pair firstPlayer\'s games and compare with different getGames views`, async () => {
      const { firstPlayerToken, thirdPlayerToken } = expect.getState();

      await quizTestManager.createPairOrConnect(firstPlayerToken);

      const gameResponse = await quizTestManager.getMyGames(firstPlayerToken);

      expect(gameResponse.totalCount).toBe(gameResponse.items.length);

      const games = gameResponse.items;
      const pendingPair = games[0];

      expect(pendingPair.status).toBe(GameStatus.PendingSecondPlayer);
      expect(
        pendingPair.secondPlayerProgress &&
          pendingPair.questions &&
          pendingPair.startGameDate &&
          pendingPair.finishGameDate,
      ).toBeNull();

      const unfinishedGame = await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
      );
      const gameById = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        pendingPair.id,
      );

      expect(pendingPair).toEqual(gameById);
      expect(pendingPair).toEqual(unfinishedGame);

      await quizTestManager.createPairOrConnect(thirdPlayerToken);

      await quizTestManager.simulateFinishGame(
        firstPlayerToken,
        thirdPlayerToken,
      );
    });
    it(`GET /pair-game-quiz/pairs/my; validate data consistency and order of finished and active firstPlayer\'s games`, async () => {
      const { firstPlayerToken, secondPlayerToken, thirdPlayerToken } =
        expect.getState();

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      await quizTestManager.createPairOrConnect(thirdPlayerToken);

      for (let i = 0; i < 5; i++) {
        i === 1 &&
          (await quizTestManager.sendAnswer(
            secondPlayerToken,
            'answer',
            HttpStatus.FORBIDDEN,
          ));

        await quizTestManager.sendAnswer(thirdPlayerToken, 'answer');
      }

      const gameResponse = await quizTestManager.getMyGames(firstPlayerToken);

      const games = gameResponse.items;
      const currentActiveGame = games[0];

      expect(currentActiveGame.status).toBe(GameStatus.Active);

      const unfinishedGame = await quizTestManager.getCurrentUnfinishedGame(
        thirdPlayerToken,
      );
      expect(currentActiveGame).toEqual({
        ...unfinishedGame,
        firstPlayerProgress: {
          ...unfinishedGame.firstPlayerProgress,
          answers: unfinishedGame.firstPlayerProgress.answers.map((a) => ({
            ...a,
            addedAt: expect.any(String),
          })),
        },
        secondPlayerProgress: {
          ...unfinishedGame.secondPlayerProgress,
          answers: unfinishedGame.secondPlayerProgress.answers.map((a) => ({
            ...a,
            addedAt: expect.any(String),
          })),
        },
      });
    });
    it(`GET /pair-game-quiz/pairs/my; testing sort fields`, async () => {
      const { firstPlayerToken } = expect.getState();

      const defaultQuerySort: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'default',
        sortDirection: SortDirections.Asc,
      };

      const querySortStatusAsc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'status',
        sortDirection: SortDirections.Asc,
      };
      const querySortStatusDesc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'status',
        sortDirection: SortDirections.Desc,
      };

      const querySortFinishDateDesc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'finishGameDate',
        sortDirection: SortDirections.Desc,
      };

      const querySortFinishDateAsc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'finishGameDate',
        sortDirection: SortDirections.Asc,
      };

      const querySortAssembledDateDesc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'startGameDate',
        sortDirection: SortDirections.Desc,
      };

      const querySortAssembledDateAsc: QuizGamesQueryFilter = {
        pageNumber: '1',
        pageSize: '10',
        sortBy: 'startGameDate',
        sortDirection: SortDirections.Asc,
      };

      const { items: firstOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortStatusAsc,
      );
      const { items: secondOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortStatusDesc,
      );

      expect(firstOutcome).toEqual(firstOutcome);
      expect(firstOutcome).not.toEqual(secondOutcome);

      const { items: thirdOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortFinishDateDesc,
      );

      const { items: fifthOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortFinishDateAsc,
      );

      expect(thirdOutcome).not.toEqual(fifthOutcome);

      const { items: sixthOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortAssembledDateDesc,
      );

      const { items: seventhOutcome } = await quizTestManager.getMyGames(
        firstPlayerToken,
        querySortAssembledDateAsc,
      );

      expect(sixthOutcome).not.toEqual(seventhOutcome);
    });
  });
  describe('GET /pair-game-quiz/pairs/my-statistic', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens } = await usersTestManager.createUsers(4);

      const [
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      ] = accessTokens;

      const numberOfGamesCreated = 10;
      await quizTestManager.simulateFinishedGames(
        accessTokens,
        numberOfGamesCreated,
      );

      expect.setState({
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      });
    });

    it(`should return correct stats`, async () => {
      const { firstPlayerToken } = expect.getState();

      const stats = await quizTestManager.getStatistics(firstPlayerToken);
    });
  });
  describe('GET /pair-game-quiz/users/top', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { users, accessTokens } = await usersTestManager.createUsers(4);

      const [
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      ] = accessTokens;

      const numberOfGamesCreated = 10;
      await quizTestManager.simulateFinishedGames(
        accessTokens,
        numberOfGamesCreated,
      );

      expect.setState({
        users,
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        fourthPlayerToken,
      });
    });
    it('Sorting by avgScores', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['avgScores asc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['avgScores desc'],
      };

      const { items: sortedAvgScoresAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );
      const { items: sortedAvgScoresDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < sortedAvgScoresAsc.length - 1; i++) {
        expect(sortedAvgScoresAsc[i].avgScores).toBeLessThanOrEqual(
          sortedAvgScoresAsc[i + 1].avgScores,
        );
        expect(sortedAvgScoresDesc[i].avgScores).toBeGreaterThanOrEqual(
          sortedAvgScoresDesc[i + 1].avgScores,
        );
      }
    });

    it('sorting by sumScore', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['sumScore desc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['sumScore asc'],
      };

      const { items: sumScoreDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      const { items: sumScoreAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < sumScoreDesc.length - 1; i++) {
        expect(sumScoreDesc[i].sumScore).toBeGreaterThanOrEqual(
          sumScoreDesc[i + 1].sumScore as number,
        );

        expect(sumScoreAsc[i].sumScore).toBeLessThanOrEqual(
          sumScoreAsc[i + 1].sumScore as number,
        );
      }
    });

    it('sorting by gamesCount', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['gamesCount desc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['gamesCount asc'],
      };

      const { items: gamesCountDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      const { items: gamesCountAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < gamesCountDesc.length - 1; i++) {
        expect(gamesCountDesc[i].gamesCount).toBeGreaterThanOrEqual(
          gamesCountDesc[i + 1].gamesCount as number,
        );

        expect(gamesCountAsc[i].gamesCount).toBeLessThanOrEqual(
          gamesCountAsc[i + 1].gamesCount as number,
        );
      }
    });
    it('sorting by winsCount', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['winsCount desc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['winsCount asc'],
      };

      const { items: winsCountDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      const { items: winsCountAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < winsCountDesc.length - 1; i++) {
        expect(winsCountDesc[i].winsCount).toBeGreaterThanOrEqual(
          winsCountDesc[i + 1].winsCount as number,
        );

        expect(winsCountAsc[i].winsCount).toBeLessThanOrEqual(
          winsCountAsc[i + 1].winsCount as number,
        );
      }
    });
    it('sorting by lossesCount', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['lossesCount desc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['lossesCount asc'],
      };

      const { items: lossesCountDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      const { items: lossesCountAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < lossesCountDesc.length - 1; i++) {
        expect(lossesCountDesc[i].lossesCount).toBeGreaterThanOrEqual(
          lossesCountDesc[i + 1].lossesCount as number,
        );

        expect(lossesCountAsc[i].lossesCount).toBeLessThanOrEqual(
          lossesCountAsc[i + 1].lossesCount as number,
        );
      }
    });
    it('sorting by drawsCount', async () => {
      const { firstPlayerToken } = expect.getState();

      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['drawsCount desc'],
      };

      const query2 = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['drawsCount asc'],
      };

      const { items: drawsCountDesc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      const { items: drawsCountAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query2,
      );

      for (let i = 0; i < drawsCountDesc.length - 1; i++) {
        expect(drawsCountDesc[i].drawsCount).toBeGreaterThanOrEqual(
          drawsCountDesc[i + 1].drawsCount as number,
        );

        expect(drawsCountAsc[i].drawsCount).toBeLessThanOrEqual(
          drawsCountAsc[i + 1].drawsCount as number,
        );
      }
    });

    it(`testing query sort`, async () => {
      const { firstPlayerToken } = expect.getState();
      const query = {
        pageNumber: '1',
        pageSize: '10',
        sort: ['avgScores asc'],
      };
      // ["avgScores desc","sumScore desc"]
      const { items: defaultSort } = await quizTestManager.getTopUsers(
        firstPlayerToken,
      );

      defaultSort.forEach((s, i, itself) => {
        if (i > 0) {
          expect(s.avgScores).toBeLessThanOrEqual(itself[i - 1].avgScores);
        }
      });

      const { items: avgScoresAsc } = await quizTestManager.getTopUsers(
        firstPlayerToken,
        query,
      );

      avgScoresAsc.forEach((s, i, itself) => {
        i > 0 &&
          expect(s.avgScores).toBeGreaterThanOrEqual(itself[i - 1].avgScores);
      });
    });
    const executePlayerStats = (stats, login) =>
      stats.items.find((s) => s.player.login === login);
    it(`should return correct stats for gamesCount and drawsCount`, async () => {
      const { firstPlayerToken, secondPlayerToken } = expect.getState();
      console.log({ firstPlayerToken });

      const stats = await quizTestManager.getTopUsers(firstPlayerToken);

      const firstPlayer = await usersTestManager.getProfile(
        null,
        firstPlayerToken,
      );

      let firstPlayerStats: PlayerStatsView;
      stats.items.forEach((stat) => {
        if (stat.player.login === firstPlayer.login) {
          firstPlayerStats = stat;
        }
      });

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const stats2 = await quizTestManager.getTopUsers(firstPlayerToken);

      const { id: gameId } = await quizTestManager.createPairOrConnect(
        secondPlayerToken,
      );

      const stats3 = await quizTestManager.getTopUsers(secondPlayerToken);

      expect(executePlayerStats(stats3, firstPlayer.login).gamesCount).toBe(
        ++firstPlayerStats.gamesCount,
      );

      // drawsCount
      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }
      const stats4 = await quizTestManager.getTopUsers(firstPlayerToken);

      expect(++firstPlayerStats.drawsCount).toBe(
        executePlayerStats(stats4, firstPlayer.login).drawsCount,
      );
    });
    it('should return correct ', async () => {});
  });
  describe('POST /pair-game-quiz/pairs/my-current/answers; pair-game-quiz.controller,', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] =
        accessTokens;

      const questionsAndAnswers =
        await quizTestManager.createQuestionsForFurtherTests(10);

      expect.setState({
        accessTokens,
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        users,
        questionsAndAnswers,
      });
    });
    // beforeEach(async () => {
    //     const { firstPlayerToken, secondPlayerToken, questionsAndAnswers } =
    //     expect.getState();

    //   const { correctAnswersForCurrentGame, gameId } =
    //     await quizTestManager.prepareForBattle(
    //       firstPlayerToken,
    //       secondPlayerToken,
    //       questionsAndAnswers,
    //     );

    //   expect.setState({
    //     gameId,
    //     correctAnswersForCurrentGame,
    //   });
    // })

    it('prepare for battle', async () => {
      const { firstPlayerToken, secondPlayerToken, questionsAndAnswers } =
        expect.getState();

      const { correctAnswersForCurrentGame, gameId } =
        await quizTestManager.prepareForBattle(
          firstPlayerToken,
          secondPlayerToken,
          questionsAndAnswers,
        );

      expect.setState({
        gameId,
        correctAnswersForCurrentGame,
      });
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should not send answer if current user is not inside active pair, 403', async () => {
      const { thirdPlayerToken } = expect.getState();
      const answer = 'answer';

      await quizTestManager.sendAnswer(
        thirdPlayerToken,
        answer,
        HttpStatus.FORBIDDEN,
      );
    });

    it('POST /pair-game-quiz/pairs/incorrect_id_format - should receive BAD_REQUEST if param has incorrect format, 400', async () => {
      const { firstPlayerToken } = expect.getState();
      const incorrectGameId = 'incorrect_id_format';

      await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        incorrectGameId,
        HttpStatus.BAD_REQUEST,
      );
    });

    it('POST /pair-game-quiz/pairs/my-current/answers - should not send answer if current user is unauthorized, 401', async () => {
      const answer = 'answer';

      await quizTestManager.sendAnswer(
        'accessToken',
        answer,
        HttpStatus.UNAUTHORIZED,
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
        gameId,
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
        HttpStatus.FORBIDDEN,
      );

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
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
          correctAnswersForCurrentGame[i * 2 + answerIdx],
        );
      }

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );
      await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      await quizTestManager.getCurrentUnfinishedGame(firstPlayerToken);
      await quizTestManager.getCurrentUnfinishedGame(secondPlayerToken);

      expect(game.firstPlayerProgress.score).toBe(5);
      expect(game.status).toBe(GameStatus.Active);
      expect(game.firstPlayerProgress.answers[0].answerStatus).toBe(
        AnswerStatus.Correct,
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
        HttpStatus.NOT_FOUND,
      );

      await quizTestManager.getCurrentGameById(
        thirdPlayerToken,
        gameId,
        HttpStatus.FORBIDDEN,
      );

      for (let i = 0; i < 5; i++) {
        //@ts-ignore
        const answerIdx = i & (0b1 === 1);
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i * 2 + answerIdx],
        );

        const game = await quizTestManager.getCurrentGameById(
          firstPlayerToken,
          gameId,
        );

        await quizTestManager.sendAnswer(
          secondPlayerToken,
          correctAnswersForCurrentGame[i],
        );

        expect(game.firstPlayerProgress.score).toBe(1 + i);
      }

      await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
        HttpStatus.OK,
      );

      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
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
          correctAnswersForCurrentGame[i * 2 + answerIdx],
        );

        const game = await quizTestManager.getCurrentGameById(
          secondPlayerToken,
          gameId,
        );

        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[2 * (i + 1) - 1],
        );

        expect(game.firstPlayerProgress.score).toBe(i);
        expect(game.secondPlayerProgress.score).toBe(i + 1);
      }

      await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );
      const gameBySecondPlayer = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
      );

      game.firstPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
        expect(game.secondPlayerProgress.answers[i].questionId).toBe(
          game.questions[i].id,
        );
      });

      gameBySecondPlayer.firstPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
      });

      expect(game.status).toBe(GameStatus.Finished);
      expect(game.firstPlayerProgress.score).toBe(5);
      expect(game.secondPlayerProgress.score).toBe(6);

      await quizTestManager.restoreGameProgress(gameId, true);
    });

    it('POST -> ../connect, POST -> "../answers", GET -> "../pairs", GET -> "/../my-current": add answers to first game, created by user2, connected by user1: add answers by each user; get active game and call "../my-current by both users after each answer"; ../connect, ../answers, /my-current, ../:id, ../connect; create pair by first player, try add answer -> 403, first player`s number of games 3;', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();
      console.log({ firstPlayerToken, secondPlayerToken });

      await quizTestManager.createPairOrConnect(secondPlayerToken);

      const { id: firstPairId } = await quizTestManager.createPairOrConnect(
        firstPlayerToken,
      );

      const { correctAnswersForCurrentGame: answers } =
        await quizTestManager.getCorrectAnswersForGame(
          firstPairId,
          questionsAndAnswers,
        );

      // give 1 correct answer by first player and 2 by second
      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, answers[i + 1]);

        i == 4 &&
          (await quizTestManager.sendAnswer(
            firstPlayerToken,
            answers[i],
            HttpStatus.FORBIDDEN,
          ));

        await quizTestManager.sendAnswer(secondPlayerToken, answers[i]);

        if (i === 4) {
          await quizTestManager.sendAnswer(
            firstPlayerToken,
            answers[i],
            HttpStatus.FORBIDDEN,
          );
          await quizTestManager.sendAnswer(
            secondPlayerToken,
            answers[i],
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const gameFirstAfterFinish = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        firstPairId,
      );

      expect(gameFirstAfterFinish.firstPlayerProgress.score).toBe(1);
      expect(gameFirstAfterFinish.secondPlayerProgress.score).toBe(3);

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
        answers[answers.length - 1],
      );
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        answers[answers.length - 1],
      );

      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );

      await quizTestManager.createPairOrConnect(firstPlayerToken);

      await quizTestManager.sendAnswer(
        thirdPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );
      const firstPlayerStats = await quizTestManager.getMyGames(
        firstPlayerToken,
      );
      expect(firstPlayerStats.totalCount).toBe(3);
    });
  });
  describe('Schedule cron autocomplete quiz', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      const { accessTokens, users } = await usersTestManager.createUsers(3);

      const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] =
        accessTokens;

      const questionsAndAnswers =
        await quizTestManager.createQuestionsForFurtherTests(10);

      const { correctAnswersForCurrentGame, gameId } =
        await quizTestManager.prepareForBattle(
          firstPlayerToken,
          secondPlayerToken,
          questionsAndAnswers,
        );

      expect.setState({
        gameId,
        correctAnswersForCurrentGame,
        accessTokens,
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        users,
        questionsAndAnswers,
      });
    });
    it(`POST /pair-game-quiz/pairs/my-current/answers testing autocomplete game after 10sec `, async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      // give 2 correct answers
      for (let i = 0; i < 3; i++) {
        const correctAnswer = correctAnswersForCurrentGame[i + 1];
        await quizTestManager.sendAnswer(firstPlayerToken, correctAnswer);
        await quizTestManager.sendAnswer(secondPlayerToken, correctAnswer);
      }
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 3],
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );

      const secondPlayerAnswersQuantityBefore =
        game.secondPlayerProgress.answers.length;
      expect(secondPlayerAnswersQuantityBefore).toBe(4);

      await wait(11);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );
      const gameAfterAutocomplete: QuizGame =
        await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      const secondPlayerAnswersQuantityAfter =
        gameAfterAutocomplete.secondPlayerProgress.answers.length;
      expect(secondPlayerAnswersQuantityAfter).toBe(5);
      expect(gameAfterAutocomplete.status).toBe(GameStatus.Finished);

      await quizTestManager.restoreGameProgress(gameId);
    });
    it(`POST /pair-game-quiz/pairs/my-current/answers testing autocomplete game and handle bonuses`, async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      // give 1 right answer by firstPlayer and 2 right answers by secondPlayer
      for (let i = 0; i < 5; i++) {
        const correctAnswer = correctAnswersForCurrentGame[i + 1];
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[!i ? i : 1],
        );
        i < 2 &&
          (await quizTestManager.sendAnswer(secondPlayerToken, correctAnswer));
      }

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 5],
      );
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 3],
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );

      const gameBySecondPlayer: QuizGame =
        await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      expect(gameBySecondPlayer.firstPlayerProgress.answers.length).toBe(5);

      const secondPlayerAnswersQuantityBefore =
        game.secondPlayerProgress.answers.length;
      expect(secondPlayerAnswersQuantityBefore).toBe(4);

      await wait(11);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );

      const gameAfterAutocomplete: QuizGame =
        await quizTestManager.getCurrentGameById(secondPlayerToken, gameId);

      const secondPlayerAnswersQuantityAfter =
        gameAfterAutocomplete.secondPlayerProgress.answers.length;
      expect(secondPlayerAnswersQuantityAfter).toBe(5);
      expect(gameAfterAutocomplete.status).toBe(GameStatus.Finished);

      await quizTestManager.restoreGameProgress(gameId);
    });
    it(`send answer delay 5 sec between answers`, async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      // give 1 right answer by firstPlayer and 2 right answers by secondPlayer
      for (let i = 0; i < 5; i++) {
        const correctAnswer = correctAnswersForCurrentGame[i + 1];
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[!i ? i : 1],
        );
        i < 2 &&
          (await quizTestManager.sendAnswer(secondPlayerToken, correctAnswer));
      }

      await wait(5);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 5],
      );

      await wait(5);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 3],
      );

      await wait(2);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 3],
        HttpStatus.FORBIDDEN,
      );

      const game: QuizGame = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
      );

      expect(game.winnerId).toBe(game.secondPlayerId);
      game.secondPlayerProgress.answers.forEach((answer, i) => {
        expect(answer.questionId).toBe(game.questions[i].id);
      });

      await quizTestManager.restoreGameProgress(gameId);
    });
    it(`complete quest after launch cron job`, async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        correctAnswersForCurrentGame,
        gameId,
      } = expect.getState();

      // send 4 answers by first player and 3 answers by second
      for (let i = 0; i < 4; i++) {
        const correctAnswer = correctAnswersForCurrentGame[i + 1];
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[!i ? i : 1],
        );
        i < 3 &&
          (await quizTestManager.sendAnswer(secondPlayerToken, correctAnswer));
      }

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 5],
      );

      await wait(11);

      const game = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );
      expect(game.status).toBe(GameStatus.Active);

      // give last answer by second player; launch cron
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        correctAnswersForCurrentGame[correctAnswersForCurrentGame.length - 2],
      );

      await wait(11);
      const completedGame = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        gameId,
      );

      expect(completedGame.status).toBe(GameStatus.Finished);
      // expect(
      //   game.firstPlayerProgress.answers.length &&
      //     game.secondPlayerProgress.answers.length,
      // ).toBe(5);
    });
  });

  describe.skip('CONSTANT TESTS', () => {
    beforeEach(async () => {
      // await cleanDatabase(httpServer);

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

    it.skip('t', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();
      console.log({ firstPlayerToken });

      const { gameId } = await quizTestManager.prepareForBattle(
        firstPlayerToken,
        secondPlayerToken,
        questionsAndAnswers,
      );

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      }
      await wait(11);
      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      const game: QuizPairViewType = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );
      const spAnswers = game.secondPlayerProgress.answers;

      expect(game.status).toBe('Finished');
      spAnswers.forEach((a, i) => {
        expect(a.questionId).toBe(game.questions[i].id);
      });
    });
    it('t', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();
      console.log({ firstPlayerToken });

      for (let i = 0; i < 4; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');
      }
      await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

      await wait(11);

      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );

      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );

      // const { gameId } = await quizTestManager.prepareForBattle(
      //   firstPlayerToken,
      //   secondPlayerToken,
      //   questionsAndAnswers,
      // );

      // const { correctAnswersForCurrentGame } =
      //   await quizTestManager.getCorrectAnswersForGame(
      //     gameId,
      //     questionsAndAnswers,
      //   );

      // for (let i = 0; i < 4; i++) {
      //   await quizTestManager.sendAnswer(
      //     firstPlayerToken,
      //     correctAnswersForCurrentGame[i + 1],
      //   );

      //   await quizTestManager.sendAnswer(
      //     secondPlayerToken,
      //     correctAnswersForCurrentGame[i + 2],
      //   );
      // }

      const game = await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
      );
      console.log({ g: JSON.stringify(game) });
    });

    it('testing', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();

      const game = await quizTestManager.createPairOrConnect(firstPlayerToken);

      const fault = await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN,
      );

      await quizTestManager.createPairOrConnect(secondPlayerToken);

      const gameId = game.id;

      const { correctAnswersForCurrentGame } =
        await quizTestManager.getCorrectAnswersForGame(
          gameId,
          questionsAndAnswers,
        );

      await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN,
      );
      await quizTestManager.createPairOrConnect(
        secondPlayerToken,
        HttpStatus.FORBIDDEN,
      );

      console.log({ firstPlayerToken, secondPlayerToken, thirdPlayerToken });

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(
          firstPlayerToken,
          correctAnswersForCurrentGame[i],
        );

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );

      const finishedGame = await quizTestManager.getCurrentGameById(
        firstPlayerToken,
        gameId,
      );

      expect(finishedGame.status).toBe(GameStatus.Finished);

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const { id: newGameId } = await quizTestManager.createPairOrConnect(
        secondPlayerToken,
      );

      for (let i = 0; i < 5; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      const newGame = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        newGameId,
      );

      await quizTestManager.createPairOrConnect(firstPlayerToken);
      const { id: newGameId2 } = await quizTestManager.createPairOrConnect(
        secondPlayerToken,
      );

      for (let i = 0; i < 4; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      const newGame2 = await quizTestManager.getCurrentGameById(
        secondPlayerToken,
        newGameId2,
      );

      await quizTestManager.createPairOrConnect(
        firstPlayerToken,
        HttpStatus.FORBIDDEN,
      );
      await quizTestManager.createPairOrConnect(
        secondPlayerToken,
        HttpStatus.FORBIDDEN,
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
        HttpStatus.NOT_FOUND,
      );
      await quizTestManager.getCurrentUnfinishedGame(
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      await quizTestManager.sendAnswer(
        firstPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );
      await quizTestManager.sendAnswer(
        secondPlayerToken,
        'answer',
        HttpStatus.FORBIDDEN,
      );

      expect.setState({ firstPlayerToken, secondPlayerToken });
    });
    it('GET STATS', async () => {
      const {
        firstPlayerToken,
        secondPlayerToken,
        thirdPlayerToken,
        questionsAndAnswers,
      } = expect.getState();

      await quizTestManager.prepareForBattle(
        firstPlayerToken,
        secondPlayerToken,
        questionsAndAnswers,
      );

      for (let i = 0; i < 4; i++) {
        await quizTestManager.sendAnswer(firstPlayerToken, 'answer');

        await quizTestManager.sendAnswer(secondPlayerToken, 'answer');
      }

      const gamesResult = await quizTestManager.getMyGames(firstPlayerToken);
      const byToken = await quizTestManager.getCurrentUnfinishedGame(
        firstPlayerToken,
      );
      const games = gamesResult.items;
      console.log({
        fPGames: JSON.stringify(games),
        byToken: JSON.stringify(byToken),
      });

      // const secondPlayerStats = await quizTestManager.getMyGames(secondPlayerToken)
      // console.log({firstPlayerStats, secondPlayerStats});
    });
  });
});
