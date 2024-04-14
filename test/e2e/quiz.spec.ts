import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { aDescribe } from '../tools/utils/aDescribe';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import * as request from 'supertest';
import { RouterPaths } from '../tools/helpers/routing';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';

aDescribe(skipSettings.for('quiz'))('SAQuizController (e2e)', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let dataSource: DataSource;
  let httpServer: HttpServer;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
    dataSource = result.testingAppModule.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
    await cleanDatabase(httpServer);
  });

  describe('GET /sa/quiz/questions', () => {
    it.skip('', async () => {
      const response = await request(httpServer)
        .get(RouterPaths.quizQuestions)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.OK);

      console.log({ res: response.body });

      expect(response.body).toBe(1);
    });
  });
  describe('POST /sa/quiz/questions', () => {
    it(`Shouldn't create question with incorrect input model, 400`, async () => {});
    it(`Shouldn't create question without authorization, 400`, async () => {});
    it(`Should create question, 201`, async () => {
      const questionBody = 'What is the capital of France?';
      const correctAnswers = ['Paris', 'paris'];

      const response = await request(httpServer)
        .post(RouterPaths.quizQuestions)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send({ body: questionBody, correctAnswers })
        .expect(HttpStatus.CREATED);

      expect(response.body.body).toEqual(questionBody);
      expect(response.body.correctAnswers).toEqual(correctAnswers);

      expect.setState({ question: response.body });
    });
  });
  it('DELETE /sa/quiz/questions', () => {});
  describe('PUT /sa/quiz/questions/id', () => {
    it('should update question and answers successfully', async () => {
      const { question } = expect.getState();

      const updatedBody = {
        body: 'Updated question text',
        correctAnswers: ['Updated answer 1', 'Updated answer 2'],
      };

      await request(httpServer)
        .put(`${RouterPaths.quizQuestions}/${question.id}`)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(updatedBody)
        .expect(HttpStatus.NO_CONTENT);

      const result =
        await dataSource.query(`SELECT *
        FROM quiz_question qq
        LEFT JOIN quiz_answer qa ON qq.id = qa.question_id`);
      console.log({result});
      
      // const { body, correctAnswers } = result;

      // expect(body).toEqual(updatedBody.body);
      // expect(correctAnswers).toEqual(updatedBody.correctAnswers);
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
  describe('PUT /sa/quiz/questions/id/publish', () => {});
});
