import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Or, And, Repository, Not } from 'typeorm';
import { QuizAnswer } from '../../../domain/entities/quiz-answer.entity';
import { QuizGame } from '../../../domain/entities/quiz-game.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-questions.entity';
import { getQuestionViewModel } from '../output.models.ts/view.models.ts/quiz-question.view-model';
import { QuizQuestionViewType } from '../output.models.ts/view.models.ts/quiz-question.view-type';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getQuestionsViewModel } from '../output.models.ts/view.models.ts/quiz-questions.view-model';
import { GameStatus } from '../input.models/statuses.model';
import {
  getQuizPendingPairsViewModel,
  getQuizPairViewModel,
} from '../output.models.ts/view.models.ts/quiz-pair.view-model';
import { get } from 'http';
import { QuizPairViewType } from '../output.models.ts/view.models.ts/quiz-game.view-type';
import { relative } from 'path';
import { QuizPlayerProgress } from '../../../domain/entities/quiz-player-progress.entity';
import { UserSession } from '../../../../../settings';
import { UserSessionDto } from '../../../../security/api';
import { UserAccount } from '../../../../auth/infrastructure/settings';

@Injectable()
export class QuizQueryRepo {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,

    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,

    @InjectRepository(QuizPlayerProgress)
    private readonly playerProgresses: Repository<QuizPlayerProgress>
  ) {}
  async getQuizQuestions(
    queryOptions: QuizQuestionsQueryFilter
  ): Promise<PaginationViewModel<QuizQuestionViewType>> {
    try {
      const { bodySearchTerm, publishedStatus } = queryOptions;

      const filter = `%${bodySearchTerm ? bodySearchTerm : ''}%`;
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      // const pagination = getPagination(queryOptions)
      // console.log({publishedStatus, pagination});

      // const testCreate = async (numberOfQuestions: number) => {
      //   const questionsAndAnswers = [];
      //   for (let i = 0; i < numberOfQuestions; i++) {
      //     const question = this.quizQuestions.create({
      //       body: `Question ${i + 1}`,
      //       published: i % 3 === 0 ? true : false,
      //     });

      //     const savedQuestion = await this.quizQuestions.save(question);

      //     const answers: QuizAnswer[] = [];

      //     for (let j = 0; j < 2; j++) {
      //       const answer = this.quizAnswers.create({
      //         answerText: `Answer ${j + 1} for question ${i + 1}`,
      //         isCorrect: j === 0 ? true : false,
      //         question: { id: savedQuestion.id },
      //       });

      //       await this.quizAnswers.save(answer);

      //       answers.push(answer);
      //     }
      //     questionsAndAnswers.push({ question, answers });
      //   }

      //   return questionsAndAnswers;
      // }

      // testCreate(3)

      const queryBuilder = this.quizQuestions.createQueryBuilder('q');

      queryBuilder
        .where('q.body ILIKE :filter', { filter })
        .leftJoin('q.correctAnswers', 'ca')
        .addSelect(['ca.id', 'ca.answerText'])
        .orderBy(
          sortBy === 'created_at' ? 'q.created_at' : `q.${sortBy}`,
          sortDirection
        )
        .skip(skip)
        .take(pageSize);

      if (publishedStatus && publishedStatus !== 'all') {
        queryBuilder.andWhere('q.published = :publishedStatus', {
          publishedStatus,
        });
      }

      const [questions, count] = await queryBuilder.getManyAndCount();

      const questionViewModel = new PaginationViewModel<QuizQuestionViewType>(
        questions.map(getQuestionsViewModel),
        pageNumber,
        pageSize,
        count
      );

      return questionViewModel;
    } catch (error) {
      throw new InternalServerErrorException(`getQuizQuestion: ${error}`);
    }
  }

  async getQuizQuestion(
    questionId: string
  ): Promise<QuizQuestionViewType | null> {
    try {
      const question = await this.quizQuestions.findOne({
        where: { id: questionId },
        relations: ['correctAnswers'],
      });

      return getQuestionViewModel(question);
    } catch (error) {
      console.log(`getQuizQuestion: ${error}`);
      return null;
    }
  }

  async isUserInGame(userId: string): Promise<Boolean> {
    try {
      const result = await this.quizPairs
        .createQueryBuilder('game')
        .leftJoin('game.firstPlayerProgress', 'fP')
        .leftJoin('game.secondPlayerProgress', 'sP')
        .where('(fP.playerId = :userId OR sP.playerId = :userId)', { userId })
        .getCount();

      return !!result;
    } catch (error) {
      console.log(`isUserInGame: ${error}`);
      return false;
    }
  }

  async getPendingPair(): Promise<QuizPairViewType | null> {
    try {
      const result = await this.quizPairs.findOne({
        where: {
          status: GameStatus.PendingSecondPlayer,
        },
      });

      if (!result) return null;

      return getQuizPendingPairsViewModel(result);
    } catch (error) {
      throw new InternalServerErrorException(`getPendingPairs: ${error}`);
    }
  }

  async getCurrentUnfinishedGame(
    userId: string
  ): Promise<QuizPairViewType | null> {
    try {
      const result = await this.quizPairs.findOne({
        where: [
          {
            firstPlayerId: userId,
            status: Not(GameStatus.Finished),
          },
          {
            secondPlayerId: userId,
            status: Not(GameStatus.Finished),
          },
        ],
        order: {
          questions: {
            order: 'ASC',
          },
          firstPlayerProgress: {
            answers: {
              created_at: 'DESC',
            },
          },
          secondPlayerProgress: {
            answers: {
              created_at: 'DESC',
            },
          },
        },
        relations: {
          questions: {
            question: true,
          },
          firstPlayerProgress: {
            answers: true,
          },
          secondPlayerProgress: {
            answers: true,
          },
        },
      });

      if (!result) return null;

      return getQuizPairViewModel(result);
    } catch (error) {
      console.log(`getPendingPairs: ${error}`);
      return null;
    }
  }

  async getPairInformation(gameId: string): Promise<QuizPairViewType | null> {
    try {
      const result = await this.quizPairs
        .createQueryBuilder('game')
        .select([
          'game.id',
          'game.status',
          'game.startGameDate',
          'game.finishGameDate',
          'game.created_at',
          'game.firstPlayerId',
          'game.secondPlayerId',
        ])
        .leftJoin('game.firstPlayerProgress', 'firstPlayerProgress')
        .addSelect(['firstPlayerProgress.login', 'firstPlayerProgress.score'])
        .leftJoin('game.secondPlayerProgress', 'secondPlayerProgress')
        .addSelect(['secondPlayerProgress.login', 'secondPlayerProgress.score'])
        .leftJoin('game.questions', 'questions')
        .leftJoin('questions.question', 'allQuestions')
        .addSelect([
          'questions.questionId',
          'allQuestions.id',
          'allQuestions.body',
        ])
        .leftJoinAndSelect('firstPlayerProgress.answers', 'fpAnswers')
        .leftJoinAndSelect('secondPlayerProgress.answers', 'spAnswers')
        .orderBy('questions.order', 'ASC')
        .orderBy('fpAnswers.created_at', 'DESC')
        .orderBy('spAnswers.created_at', 'DESC')
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      console.error(`getPairInformation finished with errors: ${error}`);
      return null;
    }
  }

  async test(user: UserAccount): Promise<any> {
    try {
      // const result = await this.quizPairs
      //   .createQueryBuilder()
      //   .delete()
      //   .from(QuizPlayerProgress)
      //   // .from(QuizAnswer)
      //   .execute()

      // console.log(result);

      const gameId = '8b31539d-eb2a-48c4-b338-e8d7d0c2a7f1';

      const result = await this.quizPairs
        .createQueryBuilder('game')
        .select([
          'game.id',
          'game.status',
          'game.startGameDate',
          'game.finishGameDate',
          'game.created_at',
          'game.firstPlayerId',
          'game.secondPlayerId',
        ])
        .leftJoin('game.firstPlayerProgress', 'firstPlayerProgress')
        .addSelect(['firstPlayerProgress.login', 'firstPlayerProgress.score'])
        .leftJoin('game.secondPlayerProgress', 'secondPlayerProgress')
        .addSelect(['secondPlayerProgress.login', 'secondPlayerProgress.score'])
        .leftJoin('game.questions', 'questions')
        .leftJoin('questions.question', 'allQuestions')
        .addSelect([
          'questions.questionId',
          'allQuestions.id',
          'allQuestions.body',
        ])
        .leftJoinAndSelect('firstPlayerProgress.answers', 'fpAnswers')
        .leftJoinAndSelect('secondPlayerProgress.answers', 'spAnswers')
        .orderBy('questions.order', 'ASC')
        .orderBy('fpAnswers.created_at', 'DESC')
        .orderBy('spAnswers.created_at', 'DESC')
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      console.error(`TESTING: ${error}`);
    }
  }
}
