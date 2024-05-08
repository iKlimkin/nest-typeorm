import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, In, Not, Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { UserAccount } from '../../../../auth/infrastructure/settings';
import { QuizGame } from '../../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../../domain/entities/quiz-player-progress.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-questions.entity';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { GameStatus } from '../input.models/statuses.model';
import { QuizPairViewType } from '../output.models.ts/view.models.ts/quiz-game.view-type';
import {
  getQuizPairViewModel,
  getQuizPendingPairsViewModel,
} from '../output.models.ts/view.models.ts/quiz-pair.view-model';
import { getQuestionViewModel } from '../output.models.ts/view.models.ts/quiz-question.view-model';
import { QuizQuestionViewType } from '../output.models.ts/view.models.ts/quiz-question.view-type';
import { getQuestionsViewModel } from '../output.models.ts/view.models.ts/quiz-questions.view-model';
import { QuizGamesQueryFilter } from '../input.models/quiz-games-query.filter';
import { GameStats } from '../output.models.ts/view.models.ts/quiz-game-analyze';

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

      const queryBuilder = this.quizQuestions.createQueryBuilder('q');

      queryBuilder
        .where('q.body ILIKE :filter', { filter })
        .leftJoin('q.correctAnswers', 'ca')
        .addSelect(['ca.id', 'ca.answerText'])
        .orderBy(
          sortBy === 'created_at' 
            ? 'q.created_at' 
            : `q.${sortBy}`,
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

  async getUserGameAnalytic(userId: string): Promise<GameStats> {
    try {
      const gamesCount = await this.playerProgresses.count({
        where: {
          player: {
            id: userId,
          },
        },
      });

      const { sumScore, avgScore } = await this.playerProgresses
        .createQueryBuilder('playerProgress')
        .where('playerProgress.playerId = :userId', { userId })
        .addSelect('SUM(playerProgress.score)', 'sumScore')
        .addSelect('AVG(playerProgress.score)', 'avgScore')
        .getRawOne();

      const winsCount = await this.quizPairs
        .createQueryBuilder('game')
        .leftJoin('game.firstPlayerProgress', 'fpProgress')
        .leftJoin('game.secondPlayerProgress', 'spProgress')
        .where(
          `
        (
          (
            game.firstPlayerId = :userId AND game.secondPlayerId IS NOT NULL AND fpProgress.score > spProgress.score
          ) 
          OR 
          (
            game.secondPlayerId = :userId AND fpProgress.score < spProgress.score
          )
        )`,
          { userId }
        )
        .getCount();

      const lossesCount = await this.quizPairs
        .createQueryBuilder('game')
        .leftJoin('game.firstPlayerProgress', 'fpProgress')
        .leftJoin('game.secondPlayerProgress', 'spProgress')
        .where(
          `
          (
              (
                game.firstPlayerId = :userId AND game.secondPlayerId IS NOT NULL AND fpProgress.score < spProgress.score
              ) 
              OR
              (
                game.secondPlayerId = :userId AND fpProgress.score > spProgress.score
              )
          )`,
          { userId }
        )
        .getCount();

      const drawsCount = await this.quizPairs
        .createQueryBuilder('game')
        .leftJoin('game.firstPlayerProgress', 'fpProgress')
        .leftJoin('game.secondPlayerProgress', 'spProgress')
        .where(
          `
          (
              (
                game.firstPlayerId = :userId AND game.secondPlayerId IS NOT NULL AND fpProgress.score = spProgress.score
              ) 
              OR
              (
                game.secondPlayerId = :userId AND fpProgress.score = spProgress.score
              )
          )`,
          { userId }
        )
        .getCount();

      {
        async function getCountByResult(
          userId: string,
          operator: string
        ): Promise<number> {
          return await this.quizPairs
            .createQueryBuilder('game')
            .leftJoin('game.firstPlayerProgress', 'fpProgress')
            .leftJoin('game.secondPlayerProgress', 'spProgress')
            .where(
              `
            (
                (game.firstPlayerId = :userId AND game.secondPlayerId IS NOT NULL AND fpProgress.score ${operator} spProgress.score) OR
                (game.secondPlayerId = :userId AND fpProgress.score ${operator.replace('>', '<').replace('<', '>')} spProgress.score)
            )`,
              { userId }
            )
            .getCount();
        }

        const promises = [
          getCountByResult.call(this, userId, '>'),
          getCountByResult.call(this, userId, '<'),
          getCountByResult.call(this, userId, '='),
        ];

        const [winsCount, lossesCount, drawsCount] =
          await Promise.all(promises);
      }

      return new GameStats({
        winsCount,
        lossesCount,
        drawsCount,
        gamesCount,
        sumScore,
        avgScore,
      });
    } catch (error) {
      throw new Error(`getUserGamesAnalyst: ${error}`);
    }
  }

  async getUserGames(
    userId: string,
    queryOptions?: QuizGamesQueryFilter
  ): Promise<PaginationViewModel<QuizPairViewType>> {
    try {
      const defaultSortDirection = 'ASC';
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const order: FindOptionsOrder<QuizGame> = {
        questions: {
          order: defaultSortDirection,
        },
        firstPlayerProgress: {
          answers: {
            created_at: defaultSortDirection,
          },
        },
        secondPlayerProgress: {
          answers: {
            created_at: defaultSortDirection,
          },
        },
      };

      if (sortBy) {
        order[sortBy] = {
          direction: sortDirection || defaultSortDirection,
        };
      }

      const relations = {
        firstPlayerProgress: {
          answers: true,
        },
        secondPlayerProgress: {
          answers: true,
        },
        questions: {
          question: true,
        },
      };

      let [quizFinishedGames, count] = await this.quizPairs.findAndCount({
        where: [
          { 
            firstPlayerId: userId, 
            status: GameStatus.Finished 
          }, 
          { 
            secondPlayerId: userId, 
            status: GameStatus.Finished
          }
        ],
        relations,
        skip,
        take: pageSize,
        order,
    });
    
      const currentGame = await this.quizPairs.findOne({
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
        order,
        relations,
        join: {
          alias: 'game',
          leftJoinAndSelect: {
            firstPlayerProgress: 'game.firstPlayerProgress',
            secondPlayerProgress: 'game.secondPlayerProgress',
            // questions: 'game.questions',
          },
        },
      });
      
      if (currentGame) {
        count++
        quizFinishedGames.unshift(currentGame)
      }

      const gamesViewModel = new PaginationViewModel<QuizPairViewType>(
        quizFinishedGames.map(getQuizPairViewModel),
        pageNumber,
        pageSize,
        count
      );

      return gamesViewModel;
    } catch (error) {
      console.log(`getUserGames: ${error}`)
      throw new Error(`getUserGames: ${error}`);
    }
  }

  async isUserInGame(
    userId: string,
  ): Promise<null | GameStatus> {
    try {
      const result = await this.quizPairs.findOne({
        where: [
          { firstPlayerId: userId, status: Not(GameStatus.Finished) },
          { secondPlayerId: userId, status: Not(GameStatus.Finished) },
        ],
      });
      
      if (!result) return null;

      return result.status
    } catch (error) {
      throw new Error(`isUserInGame: ${error}`);
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
              created_at: 'ASC',
            },
          },
          secondPlayerProgress: {
            answers: {
              created_at: 'ASC',
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
      console.log(`getCurrentUnfinishedGame: ${error}`);
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
        .orderBy('fpAnswers.created_at', 'ASC')
        .orderBy('spAnswers.created_at', 'ASC')
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      console.log(`getPairInformation finished with errors: ${error}`);
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
