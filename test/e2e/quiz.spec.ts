import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { aDescribe } from '../tools/utils/aDescribe';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import * as request from 'supertest';
import { RouterPaths, NavigationEnum } from '../tools/helpers/routing';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { QuizAnswer, QuizQuestion } from '../../src/settings';
import { AuthController } from '../../src/features/auth/infrastructure/settings';
import { EmailManager } from '../../src/infra/managers/email-manager';
import { EmailManagerMock } from '../tools/dummies/email.manager.mock';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizTestManager } from '../tools/managers/QuizTestManager';
import { QuizQuestionsQueryFilter } from '../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import { publishedStatuses } from '../../src/features/quiz/api/models/input.models/statuses.model';
import { SortDirections } from '../../src/domain/sorting-base-filter';

aDescribe(skipSettings.for('quiz'))('SAQuizController (e2e)', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let dataSource: DataSource;
  let httpServer: HttpServer;
  let quizQuestionRepository: Repository<QuizQuestion>;
  let quizAnswerRepository: Repository<QuizAnswer>;
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
    quizAnswerRepository = app.get(getRepositoryToken(QuizQuestion));

    quizQuestionManager = new QuizTestManager(
      app,
      NavigationEnum.quizQuestions
    );
    quizPairManager = new QuizTestManager(app, NavigationEnum.quizPairs);
    usersTestManager = settings.usersTestManager;
  });

  afterAll(async () => {
    // await cleanDatabase(httpServer);
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

      console.log({ questions });
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

      // const publishedQuestionId = 'published-question-id';
      // const publishedBody = { published: true };
      // await request(httpServer())
      //   .put(`/your-route/${publishedQuestionId}/publish`)
      //   .send(publishedBody)
      //   .expect(HttpStatus.BAD_REQUEST);
    });
  });

  beforeEach(async () => {
    const { accessTokens, users } = await usersTestManager.createUsers(3);

    expect.setState({ accessTokens, users });
  });

  describe.skip('TEST', () => {
    it('GET QUESTIONS', async () => {
      await quizQuestionManager.getQuestions();
    });
  });

  describe('POST /pair-game-quiz/pairs/connection', () => {
    beforeAll(async () => {
      const prepareForBattle =
        await quizQuestionManager.createQuestionsForFurtherTests(10);
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

    it('should connect user to an existing pair if available', async () => {
      const { accessTokens } = expect.getState();

      const response = await quizPairManager.createPairOrConnect(
        accessTokens[1]
      );

      const gameId = response.id;

      expect(response.status).toBe('Active');
      expect(response.secondPlayerProgress).not.toBeNull();
      expect(response.questions).toHaveLength(5)
    });
  });
});
