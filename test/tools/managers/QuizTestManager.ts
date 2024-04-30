import { HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { PaginationViewModelType } from '../../../src/domain/pagination-view.model';
import { CreateQuestionData } from '../../../src/features/quiz/api/models/input.models/create-question.model';
import { QuizQuestionsQueryFilter } from '../../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import { GameStatus } from '../../../src/features/quiz/api/models/input.models/statuses.model';
import { UpdateQuestionData } from '../../../src/features/quiz/api/models/input.models/update-question.model';
import { QuizPairViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizQuestionViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-question.view-type';
import {
  CurrentGameQuestion,
  QuizAnswer,
  QuizCorrectAnswer,
  QuizGame,
  QuizPlayerProgress,
  QuizQuestion,
} from '../../../src/settings';
import { NavigationEnum } from '../helpers/routing';

export type QuestionsAndAnswersDB = {
  savedQuestion: QuizQuestion;
  answers: QuizCorrectAnswer[];
}[];

export class QuizTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: NavigationEnum
  ) {}
  private application = this.app.getHttpServer();
  private quizQuestionRepository = this.app.get<Repository<QuizQuestion>>(
    getRepositoryToken(QuizQuestion)
  );
  private quizGames = this.app.get<Repository<QuizGame>>(
    getRepositoryToken(QuizGame)
  );
  private quizGameQuestions = this.app.get<Repository<CurrentGameQuestion>>(
    getRepositoryToken(CurrentGameQuestion)
  );
  private quizPlayerProgresses = this.app.get<Repository<QuizPlayerProgress>>(
    getRepositoryToken(QuizPlayerProgress)
  );
  private quizCorrectAnswersRepository = this.app.get<
    Repository<QuizCorrectAnswer>
  >(getRepositoryToken(QuizCorrectAnswer));

  createQuestion(field?: any) {
    if (!field) {
      return {
        body: ' ',
        correctAnswers: ' ',
      };
    } else {
      return {
        body: field.body,
        correctAnswers: field.correctAnswers,
      };
    }
  }
  async createPairOrConnect(accessToken: string, expectStatus = HttpStatus.OK) {
    const response = await request(this.application)
      .post(`${this.routing}/connection`)
      .auth(accessToken, { type: 'bearer' })
      .expect(expectStatus);

    return response.body;
  }

  async sendAnswer(
    accessToken: string,
    answer: string,
    expectStatus = HttpStatus.OK
  ) {
    const response = await request(this.application)
      .post(`${this.routing}/my-current/answers`)
      .auth(accessToken, { type: 'bearer' })
      .send({ answer })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentGameById(
    accessToken: string,
    gameId: string,
    expectStatus = HttpStatus.OK
  ) {
    const response = await request(this.application)
      .get(`${this.routing}/${gameId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentUnfinishedGame(
    accessToken: string,
    expectStatus = HttpStatus.OK
  ): Promise<QuizPairViewType> {
    const response = await request(this.application)
      .get(`${this.routing}/my-current`)
      .auth(accessToken, { type: 'bearer' })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentGameQuestions(
    gameId: string
  ): Promise<CurrentGameQuestion[]> {
    const questions = await this.quizGameQuestions.findBy({
      quizPair: { id: gameId },
    });
    return questions;
  }

  async getCurrentGameAnswers(gameId: string): Promise<QuizAnswer[]> {
    const questions = await this.quizGameQuestions.findBy({
      quizPair: { id: gameId },
    });
    return;
  }

  async getQuestionWithAnswers(questionId: string): Promise<{
    question: QuizQuestion;
    answers: QuizCorrectAnswer[];
  }> {
    const question = await this.quizQuestionRepository.findOne({
      where: { id: questionId },
    });

    const answers = await this.quizCorrectAnswersRepository.find({
      where: {
        question: {
          id: questionId,
        },
      },
    });

    return { question, answers };
  }

  async createQuestionWithAnswers(
    createdBody: CreateQuestionData
  ): Promise<QuizQuestionViewType> {
    const result = await request(this.application)
      .post(this.routing)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(createdBody)
      .expect(HttpStatus.CREATED);

    const question = result.body;

    return question;
  }

  async updateQuestion(questionId: string, updatedBody: UpdateQuestionData) {
    await request(this.application)
      .put(`${this.routing}/${questionId}`)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(updatedBody)
      .expect(HttpStatus.NO_CONTENT);
  }

  async createQuestionsForFurtherTests(
    numberOfQuestions: number
  ): Promise<QuestionsAndAnswersDB> {
    const questionsAndAnswers = [];
    for (let i = 0; i < numberOfQuestions; i++) {
      const question = this.quizQuestionRepository.create({
        body: `Question ${i + 1}`,
        published: i < 4 ? false : true,
      });

      const savedQuestion = await this.quizQuestionRepository.save(question);

      const answers: QuizCorrectAnswer[] = [];

      for (let j = 0; j < 2; j++) {
        const answer = this.quizCorrectAnswersRepository.create({
          answerText: `Answer ${j + 1} for question ${i + 1}`,
          question: { id: savedQuestion.id },
        });

        const savedAnswer =
          await this.quizCorrectAnswersRepository.save(answer);

        answers.push(savedAnswer);
      }
      questionsAndAnswers.push({ savedQuestion, answers });
    }

    return questionsAndAnswers;
  }

  async getQuestions(
    query?: QuizQuestionsQueryFilter
  ): Promise<PaginationViewModelType<QuizQuestionViewType>> {
    const response = await request(this.application)
      .get(this.routing)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .query(query)
      .expect(HttpStatus.OK);

    return response.body;
  }

  async restoreGameProgress(gameId: string, restorePair?: boolean) {
    await this.quizGames
      .createQueryBuilder()
      .delete()
      .from(QuizAnswer)
      .execute();

    const currentPair = await this.quizGames.findOne({
      where: { id: gameId },
      relations: ['firstPlayerProgress', 'secondPlayerProgress'],
    });

    currentPair.version = 0;
    currentPair.firstPlayerProgress.score = 0;
    currentPair.firstPlayerProgress.questCompletionDate = null;
    currentPair.secondPlayerProgress.score = 0;
    currentPair.firstPlayerProgress.answersCount = 0;
    currentPair.secondPlayerProgress.questCompletionDate = null;
    currentPair.secondPlayerProgress.answersCount = 0;
    currentPair.finishGameDate = null;
    currentPair.status = GameStatus.Active;

    await this.quizGames.save(currentPair);
    await this.quizPlayerProgresses.save([
      currentPair.firstPlayerProgress,
      currentPair.secondPlayerProgress,
    ]);

    if (restorePair) {
      await this.quizGames.remove(currentPair);
    }
  }

  async prepareForBattle(
    firstPlayerToken: string,
    secondPlayerToken: string,
    questionsAndAnswers: QuestionsAndAnswersDB
  ): Promise<{
    gameId: string;
    correctAnswersForCurrentGame: string[];
  }> {
    const response = await this.createPairOrConnect(firstPlayerToken);

    await this.createPairOrConnect(secondPlayerToken);

    const gameId = response.id;

    const gameQuestions = await this.getCurrentGameQuestions(gameId);
    expect(gameQuestions).toHaveLength(5);

    const correctAnswersForCurrentGame: string[] = [];

    gameQuestions.forEach((gameQuestion) => {
      const matchingQuestion = questionsAndAnswers.find(
        (qa) => qa.savedQuestion.id === gameQuestion.questionId
      );
      if (matchingQuestion) {
        matchingQuestion.answers.forEach((answer) => {
          correctAnswersForCurrentGame.push(answer.answerText);
        });
      }
    });

    return {
      gameId,
      correctAnswersForCurrentGame,
    };
  }
}
