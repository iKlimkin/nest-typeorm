import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { QuizGame } from '../../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../../domain/entities/quiz-player-progress.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-questions.entity';
import {
  QuizGamesQueryFilter,
  StatsQueryFilter,
} from '../input.models/quiz-games-query.filter';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { GameStatus, publishedStatuses } from '../input.models/statuses.model';
import {
  GameStats,
  IUserStats,
  PlayerStatsView,
  UserStats,
} from '../output.models.ts/view.models.ts/quiz-game-analyze';
import { QuizPairViewType } from '../output.models.ts/view.models.ts/quiz-game.view-type';
import {
  getQuizPairViewModel,
  getQuizPendingPairsViewModel,
} from '../output.models.ts/view.models.ts/quiz-pair.view-model';
import { getQuestionViewModel } from '../output.models.ts/view.models.ts/quiz-question.view-model';
import { QuizQuestionViewType } from '../output.models.ts/view.models.ts/quiz-question.view-type';
import { getQuestionsViewModel } from '../output.models.ts/view.models.ts/quiz-questions.view-model';
import { transformRawQuizDataToView } from '../output.models.ts/view.models.ts/quiz-raw.view-model';

export interface QuizQueryRepository<T> {
  getUserGames(
    userId: string,
    queryOptions: QuizGamesQueryFilter,
  ): Promise<PaginationViewModel<T>>;
  getUsersTop(queryOptions: StatsQueryFilter): Promise<any>;
  getUserGameAnalytic(userId: string): Promise<GameStats>;
  getCurrentUnfinishedGame(userId: string): Promise<QuizPairViewType | null>;
  getPairInformation(gameId: string): Promise<T | null>;
  getPendingPair(): Promise<T | null>;
  isUserInGame(userId: string, gameId: string): Promise<null | GameStatus>;
}

@Injectable()
export class QuizQueryRepo implements QuizQueryRepository<QuizPairViewType> {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,

    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,

    @InjectRepository(QuizPlayerProgress)
    private readonly playerProgresses: Repository<QuizPlayerProgress>,

    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}
  async getQuizQuestions(
    queryOptions: QuizQuestionsQueryFilter,
  ): Promise<PaginationViewModel<QuizQuestionViewType>> {
    try {
      let { bodySearchTerm, publishedStatus } = queryOptions;

      publishedStatus = publishedStatus ?? publishedStatuses.all;

      const filter = `%${bodySearchTerm || ''}%`;
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const queryBuilder = this.quizQuestions.createQueryBuilder('q');

      queryBuilder
        .where('q.body ILIKE :filter', { filter })
        .leftJoin('q.correctAnswers', 'ca')
        .addSelect(['ca.id', 'ca.answerText'])
        .orderBy(
          sortBy === 'created_at' ? 'q.created_at' : `q.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      if (publishedStatus !== publishedStatuses.all) {
        queryBuilder.andWhere('q.published = :publishedStatus', {
          publishedStatus,
        });
      }

      const [questions, count] = await queryBuilder.getManyAndCount();

      const questionViewModel = new PaginationViewModel<QuizQuestionViewType>(
        questions.map(getQuestionsViewModel),
        pageNumber,
        pageSize,
        count,
      );

      return questionViewModel;
    } catch (error) {
      throw new InternalServerErrorException(`getQuizQuestion: ${error}`);
    }
  }

  async getQuizQuestion(
    questionId: string,
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
      const gamesCount = await this.quizPairs
        .createQueryBuilder('game')
        .where(
          'game.firstPlayerId = :userId OR game.secondPlayerId = :userId',
          { userId },
        )
        .getCount();

      const playerProgressQueryBuilder =
        this.playerProgresses.createQueryBuilder('playerProgress');

      const sumScoreQuery = playerProgressQueryBuilder
        .select('SUM(playerProgress.score)', 'sumScore')
        .where('playerProgress.playerId = :userId', { userId })
        .getRawOne();

      const avgScoreQuery = playerProgressQueryBuilder
        .select('AVG(playerProgress.score)', 'avgScore')
        .where('playerProgress.playerId = :userId', { userId })
        .getRawOne();

      const [{ sumScore }, { avgScore }] = await Promise.all([
        sumScoreQuery,
        avgScoreQuery,
      ]);

      const getCountByResult = async (
        userId: string,
        operator: string,
      ): Promise<number> =>
        this.quizPairs
          .createQueryBuilder('game')
          .leftJoin('game.firstPlayerProgress', 'fp')
          .leftJoin('game.secondPlayerProgress', 'sp')
          .where(
            `
            (
              game.firstPlayerId = :userId AND game.status IN (:...statuses) AND fp.score ${operator} sp.score
            ) 
            OR 
            (
              game.secondPlayerId = :userId AND game.status IN (:...statuses) AND sp.score ${operator} fp.score
            )
          `,
            { userId, statuses: [GameStatus.Active, GameStatus.Finished] },
          )
          .getCount();

      const promises = [
        getCountByResult.call(this, userId, '>'),
        getCountByResult.call(this, userId, '<'),
        getCountByResult.call(this, userId, '='),
      ];

      const [winsCount, lossesCount, drawsCount] = await Promise.all(promises);

      return new GameStats(
        winsCount,
        lossesCount,
        drawsCount,
        gamesCount,
        sumScore,
        avgScore,
      );
    } catch (error) {
      throw new Error(`getUserGamesAnalyst: ${error}`);
    }
  }

  async getUsersTop(queryOptions?: StatsQueryFilter) {
    try {
      const { pageNumber, pageSize, sort, skip } = getPagination(queryOptions);

      let statsQuery = `
        SELECT 
          player.id,
          player.login,
          COALESCE(SUM(pp.score), 0) AS "sumScore",
          COALESCE(AVG(pp.score), 0) AS "avgScores",
          COUNT(games.id) AS "gamesCount",
          COUNT(
            CASE
              WHEN games."winnerId" = player.id AND games.status = 'Finished'
              THEN 1
            END
          ) AS "winsCount",
          COUNT(
            CASE
              WHEN games."winnerId" != player.id AND games."winnerId" IS NOT NULL
              THEN 1
            END
          ) AS "lossesCount",
          COUNT(
            CASE
              WHEN games."winnerId" IS NULL AND games.status = 'Finished'
              THEN 1
            END
          ) AS "drawsCount"
          FROM (
            SELECT
              g.id,
              g."winnerId"::UUID,
              g.status,
              g."firstPlayerId"::uuid AS playerId,
              g."firstPlayerProgressId" AS progressId
            FROM quiz_game g
            UNION ALL
            SELECT
              g.id,
              g."winnerId"::UUID,
              g.status,
              g."secondPlayerId"::uuid AS playerId,
              g."secondPlayerProgressId" AS progressId
            FROM quiz_game g
          ) AS games
          LEFT JOIN quiz_player_progress pp ON pp.id = games.progressId
          LEFT JOIN user_account player ON player.id = games.playerId
          GROUP BY player.id, player.login
          ORDER BY
      `;

      sort.forEach((sortRule, i) => {
        let [sortBy, sortDir] = sortRule.split(' ');
        sortDir = sortDir.toUpperCase();
        statsQuery += ` "${sortBy}" ${sortDir},`;
        i === sort.length - 1 && (statsQuery = statsQuery.slice(0, -1));
      });

      if (skip) {
        statsQuery += `\nOFFSET ${skip}`;
      }
      statsQuery += `\nLIMIT ${pageSize}`;

      const result: IUserStats[] = await this.dataSource.query(statsQuery);

      const [{ count }] = await this.dataSource.query(`
        SELECT COUNT(DISTINCT pp."playerId")
        FROM quiz_player_progress pp
      `);

      const topStats = result.map((stat: IUserStats) => {
        const {
          avgScores,
          drawsCount,
          sumScore,
          login,
          lossesCount,
          gamesCount,
          id,
          winsCount,
        } = new UserStats(stat);

        return {
          sumScore,
          avgScores,
          gamesCount,
          winsCount,
          lossesCount,
          drawsCount,
          player: {
            id,
            login,
          },
        };
      });

      const statsViewModel = new PaginationViewModel<PlayerStatsView>(
        topStats,
        pageNumber,
        pageSize,
        count,
      );

      return statsViewModel;
    } catch (error) {
      throw new Error(`getTopUsers: ${error}`);
    }
  }
  async getUserGames(
    userId: string,
    queryOptions?: QuizGamesQueryFilter,
  ): Promise<PaginationViewModel<QuizPairViewType>> {
    try {
      let { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const query = `
        SELECT 
          g.id,
          g."firstPlayerId",
          g."secondPlayerId",
          g."created_at",
          g."startGameDate",
          g."finishGameDate",
          g."status",
          json_build_object(
                'login', fPP.login, 
                'score', fPP.score, 
                'answers', (
                    SELECT json_agg(
                        json_build_object(
                            'questionId', fa."questionId",
                            'answerStatus', fa."answerStatus",
                            'addedAt', fa."created_at"
                        )
                        ORDER BY fa."created_at"
                    )
                    FROM quiz_answer fa
                    WHERE fa."playerProgressId" = fPP.id
                )
            ) AS "firstPlayerProgressRaw",
          json_build_object(
              'login', sPP.login,
              'score', sPP.score, 
              'answers', (
                  SELECT json_agg(
                      json_build_object(
                          'questionId', sa."questionId",
                          'answerStatus', sa."answerStatus",
                          'addedAt', sa."created_at"
                      )
                      ORDER BY sa."created_at"
                  )
                  FROM quiz_answer sa
                  WHERE sa."playerProgressId" = sPP.id
              )
          ) AS "secondPlayerProgressRaw",
            json_agg(
                json_build_object(
                    'id', qq.id,
                    'body', qq.body,
                    'order', cq.order
                )
                ORDER BY cq."order"
            ) AS questions
          FROM quiz_game g 
          LEFT JOIN quiz_player_progress fPP ON g."firstPlayerProgressId" = fPP."id"
          LEFT JOIN quiz_player_progress sPP ON g."secondPlayerProgressId" = sPP."id"
          LEFT JOIN current_game_question cq ON g."id" = cq."quizPairId"
          LEFT JOIN quiz_question qq ON qq.id = cq."questionId"
          WHERE $1 IN (g."firstPlayerId", g."secondPlayerId")
          GROUP BY g.id, fPP.id, sPP.id
          ORDER BY 
            ${sortBy} ${sortDirection},
            g.created_at DESC
          LIMIT $2 
          OFFSET $3;
        `;

      const count = await this.quizPairs
        .createQueryBuilder('game')
        .where(
          'game.firstPlayerId = :userId OR game.secondPlayerId = :userId',
          { userId },
        )
        .getCount();

      const queryResult = await this.dataSource.query(query, [
        userId,
        pageSize,
        skip,
      ]);

      const userGames = queryResult.map(transformRawQuizDataToView);

      const gamesViewModel = new PaginationViewModel<QuizPairViewType>(
        userGames,
        pageNumber,
        pageSize,
        count,
      );

      return gamesViewModel;
    } catch (error) {
      console.log(`getUserGames: ${error}`);
      throw new Error(`getUserGames: ${error}`);
    }
  }

  async isUserInGame(userId: string): Promise<null | GameStatus> {
    try {
      const result = await this.quizPairs.findOne({
        where: [
          { firstPlayerId: userId, status: Not(GameStatus.Finished) },
          { secondPlayerId: userId, status: Not(GameStatus.Finished) },
        ],
      });

      if (!result) return null;

      return result.status;
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
    userId: string,
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
        .addOrderBy('fpAnswers.created_at', 'ASC')
        .addOrderBy('spAnswers.created_at', 'ASC')
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      console.log(`getPairInformation finished with errors: ${error}`);
      return null;
    }
  }
}
