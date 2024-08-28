import { HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { PaginationViewModelType } from '../../../src/domain/pagination-view.model';
import { SortDirections } from '../../../src/domain/sorting-base-filter';
import { CreateQuestionData } from '../../../src/features/quiz/api/models/input.models/create-question.model';
import { InputPublishData } from '../../../src/features/quiz/api/models/input.models/publish-question.model';
import { GameStatus } from '../../../src/features/quiz/api/models/input.models/statuses.model';
import { UpdateQuestionData } from '../../../src/features/quiz/api/models/input.models/update-question.model';
import {
  GameStatsData,
  PlayerStatsView,
} from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game-analyze';
import { QuizPairViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizQuestionViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-question.view-type';
import { ApiRouting } from '../routes/api.routing';
import {
  QuizGamesQueryFilter,
  StatsQueryFilter,
} from '../../../src/features/quiz/api/models/input.models/quiz-games-query.filter';
import { QuizQuestion } from '../../../src/features/quiz/domain/entities/quiz-questions.entity';
import { QuizCorrectAnswer } from '../../../src/features/quiz/domain/entities/quiz-correct-answers.entity';
import { QuizGame } from '../../../src/features/quiz/domain/entities/quiz-game.entity';
import { QuizAnswer } from '../../../src/features/quiz/domain/entities/quiz-answer.entity';
import { CurrentGameQuestion } from '../../../src/features/quiz/domain/entities/current-game-questions.entity';
import { QuizPlayerProgress } from '../../../src/settings';

export type QuestionsAndAnswersDB = {
  savedQuestion: QuizQuestion;
  answers: QuizCorrectAnswer[];
}[];
const type = 'bearer';

export class QuizTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: ApiRouting,
  ) {}
  private application = this.app.getHttpServer();
  private quizQuestionRepository = this.app.get<Repository<QuizQuestion>>(
    getRepositoryToken(QuizQuestion),
  );
  private quizGames = this.app.get<Repository<QuizGame>>(
    getRepositoryToken(QuizGame),
  );
  private playerAnswers = this.app.get<Repository<QuizAnswer>>(
    getRepositoryToken(QuizAnswer),
  );
  private quizGameQuestions = this.app.get<Repository<CurrentGameQuestion>>(
    getRepositoryToken(CurrentGameQuestion),
  );
  private quizPlayerProgresses = this.app.get<Repository<QuizPlayerProgress>>(
    getRepositoryToken(QuizPlayerProgress),
  );
  private quizCorrectAnswersRepository = this.app.get<
    Repository<QuizCorrectAnswer>
  >(getRepositoryToken(QuizCorrectAnswer));

  createQuestionBody(field?: any) {
    return {
      body: field?.body || ' ',
      correctAnswers: field?.correctAnswers || [],
    };
  }

  async createQuestion(
    body: CreateQuestionData | any,
    expectStatus = HttpStatus.CREATED,
    auth = true,
  ): Promise<void> {
    if (!auth) {
      await request(this.application)
        .post(this.routing.questions.createQuestion())
        .send(body)
        .expect(HttpStatus.UNAUTHORIZED);
      return;
    }

    await request(this.application)
      .post(this.routing.questions.createQuestion())
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(body)
      .expect(expectStatus);
  }

  async getQuestions(
    query?: any,
  ): Promise<PaginationViewModelType<QuizQuestionViewType>> {
    const response = await request(this.application)
      .get(this.routing.questions.getQuestions())
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .query(query)
      .expect(HttpStatus.OK);

    return response.body;
  }

  async createQuestions(quantityOfQuestions: number) {
    for (let i = 0; i < quantityOfQuestions; i++) {
      const questionBody = {
        body: `question ${i}`,
        correctAnswers: [
          `answer ${i + 1} for q${i}`,
          `answer ${i + 2} for q${i}`,
          `answer ${i + 3} for q${i}`,
        ],
      };

      await this.createQuestion(questionBody);
    }
  }

  async createAndPublishQuestions(quantityOfQuestions: number) {
    for (let i = 0; i < quantityOfQuestions; i++) {
      const questionBody = {
        body: `question ${i}`,
        correctAnswers: [
          `answer ${i + 1} for q${i}`,
          `answer ${i + 2} for q${i}`,
          `answer ${i + 3} for q${i}`,
        ],
      };

      await this.createQuestion(questionBody);
    }

    const { items: questions } = await this.getQuestions();

    for (let i = 0; i < questions.length; i++) {
      await this.publishQuestion(questions[i].id, {
        published: true,
      });
    }
  }

  async createPairOrConnect(accessToken: string, expectStatus = HttpStatus.OK) {
    const response = await request(this.application)
      .post(this.routing.pairs.connectOrCreate())
      .auth(accessToken, { type })
      .expect(expectStatus);

    return response.body;
  }

  async sendAnswer(
    accessToken: string,
    answer: string,
    expectStatus = HttpStatus.OK,
  ) {
    const response = await request(this.application)
      .post(this.routing.pairs.sendAnswer())
      .auth(accessToken, { type })
      .send({ answer })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentGameById(
    accessToken: string,
    gameId: string,
    expectStatus = HttpStatus.OK,
  ) {
    const response = await request(this.application)
      .get(this.routing.pairs.getGame(gameId))
      .auth(accessToken, { type })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentUnfinishedGame(
    accessToken: string,
    expectStatus = HttpStatus.OK,
  ): Promise<QuizPairViewType> {
    const response = await request(this.application)
      .get(this.routing.pairs.getCurrentUnfinishedGame())
      .auth(accessToken, { type })
      .expect(expectStatus);

    return response.body;
  }

  async getCurrentGameQuestions(
    gameId: string,
  ): Promise<CurrentGameQuestion[]> {
    const questions = await this.quizGameQuestions.findBy({
      quizPair: { id: gameId },
    });
    return questions;
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
    createdBody: CreateQuestionData,
  ): Promise<QuizQuestionViewType> {
    const result = await request(this.application)
      .post(this.routing.questions.createQuestion())
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(createdBody)
      .expect(HttpStatus.CREATED);

    const question = result.body;

    return question;
  }

  async updateQuestion(questionId: string, updatedBody: UpdateQuestionData) {
    await request(this.application)
      .put(this.routing.questions.updateQuestion(questionId))
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(updatedBody)
      .expect(HttpStatus.NO_CONTENT);
  }

  async publishQuestion(questionId: string, publishData: InputPublishData) {
    await request(this.application)
      .put(this.routing.questions.publishQuestion(questionId))
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(publishData)
      .expect(HttpStatus.NO_CONTENT);
  }

  async createQuestionsForFurtherTests(
    numberOfQuestions: number,
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

        const savedAnswer = await this.quizCorrectAnswersRepository.save(
          answer,
        );

        answers.push(savedAnswer);
      }
      questionsAndAnswers.push({ savedQuestion, answers });
    }

    return questionsAndAnswers;
  }

  async getMyGames(
    accessToken: string,
    query?: QuizGamesQueryFilter,
  ): Promise<PaginationViewModelType<QuizPairViewType>> {
    const response = await request(this.application)
      .get(this.routing.pairs.getUserGames())
      .auth(accessToken, { type })
      .query(query)
      .expect(HttpStatus.OK);

    return response.body;
  }

  async getTopUsers(
    query?: StatsQueryFilter,
  ): Promise<PaginationViewModelType<PlayerStatsView>> {
    const response = await request(this.application)
      .get(this.routing.pairs.getTopUsers())
      .query(query)
      .expect(HttpStatus.OK);

    return response.body;
  }

  async getStatistics(accessToken: string): Promise<GameStatsData> {
    const response = await request(this.application)
      .get(this.routing.pairs.getUserStatistic())
      .auth(accessToken, { type })
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
    currentPair.firstPlayerProgress.answers = [];
    currentPair.secondPlayerProgress.answers = [];
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

    await this.playerAnswers.clear();

    if (restorePair) {
      await this.quizGames.remove(currentPair);
      await this.quizPlayerProgresses.remove([
        currentPair.firstPlayerProgress,
        currentPair.secondPlayerProgress,
      ]);
    }
  }

  async prepareForBattle(
    firstPlayerToken: string,
    secondPlayerToken: string,
    questionsAndAnswers: QuestionsAndAnswersDB,
  ): Promise<{
    gameId: string;
    correctAnswersForCurrentGame: string[];
  }> {
    const response = await this.createPairOrConnect(firstPlayerToken);

    await this.createPairOrConnect(secondPlayerToken);

    const gameId = response.id;

    return this.getCorrectAnswersForGame(gameId, questionsAndAnswers);
  }

  async simulateFinishedGames(playerTokens: string[], numberOfGames: number) {
    const questionsAndAnswers = await this.createQuestionsForFurtherTests(100);

    for (let i = 0; i < numberOfGames; i++) {
      const currentPlayerIdx = i % playerTokens.length;
      const otherPlayerIdx = (currentPlayerIdx + 1) % playerTokens.length;

      const currentPlayerToken = playerTokens[currentPlayerIdx];
      const otherPlayerToken = playerTokens[otherPlayerIdx];

      const { correctAnswersForCurrentGame } = await this.prepareForBattle(
        currentPlayerToken,
        otherPlayerToken,
        questionsAndAnswers,
      );

      await this.simulateFinishGame(
        currentPlayerToken,
        otherPlayerToken,
        correctAnswersForCurrentGame,
      );
    }
  }

  checkConsistencyOfDataSorting(
    games: QuizPairViewType[],
    options?: {
      sortDirection?: SortDirections;
      sortField?: string;
    },
  ) {
    const {
      sortDirection = SortDirections.DESC,
      sortField = 'pairCreatedDate',
    } = options || {};
    this.checkSortingByDateField(games, sortDirection, sortField);
  }

  private checkSortingByDateField(
    games: QuizPairViewType[],
    sortDirection: SortDirections,
    sortField: string,
  ) {
    for (let i = 0; i < games.length - 1; i++) {
      const currentGameField = new Date(games[i][sortField]).getTime();
      const nextGameField = new Date(games[i + 1][sortField]).getTime();

      sortDirection === SortDirections.DESC
        ? expect(nextGameField).toBeLessThanOrEqual(currentGameField)
        : expect(currentGameField).toBeLessThanOrEqual(nextGameField);
    }
  }

  async simulateFinishGame(
    firstPlayerToken: string,
    secondPlayerToken: string,
    correctAnswersForCurrentGame: any[] = [],
  ) {
    if (!correctAnswersForCurrentGame.length) {
      correctAnswersForCurrentGame = this.generateDefaultAnswers();
    }

    for (let i = 0; i < 5; i++) {
      const answerIdx = Math.random() >= 0.5 ? 0 : 1;
      const currentPlayerToken =
        i % 2 === 0 ? firstPlayerToken : secondPlayerToken;
      const otherPlayerToken =
        i % 2 === 0 ? secondPlayerToken : firstPlayerToken;

      await this.sendAnswer(
        currentPlayerToken,
        correctAnswersForCurrentGame[i * 2 + answerIdx],
      );

      if (answerIdx) {
        await this.sendAnswer(otherPlayerToken, 'incorrect_answer');
      } else {
        const randomAnswerIdx = Math.floor(
          Math.random() * correctAnswersForCurrentGame.length,
        );
        await this.sendAnswer(
          otherPlayerToken,
          correctAnswersForCurrentGame[randomAnswerIdx],
        );
      }
    }
  }

  private generateDefaultAnswers = () =>
    Array(5)
      .fill('a')
      .flatMap((c) => [c, c]);

  async getCorrectAnswersForGame(
    gameId: string,
    questionsAndAnswers: QuestionsAndAnswersDB,
  ) {
    const gameQuestions = await this.getCurrentGameQuestions(gameId);
    expect(gameQuestions).toHaveLength(5);

    const correctAnswersForCurrentGame: string[] = [];

    gameQuestions.forEach((gameQuestion) => {
      const matchingQuestion = questionsAndAnswers.find(
        (qa) => qa.savedQuestion.id === gameQuestion.questionId,
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
