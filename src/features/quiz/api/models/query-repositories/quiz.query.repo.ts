import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsOrder,
  In,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { UserAccount } from '../../../../auth/infrastructure/settings';
import { QuizGame } from '../../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../../domain/entities/quiz-player-progress.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-questions.entity';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { GameStatus, publishedStatuses } from '../input.models/statuses.model';
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
import { QuizAnswer } from '../../../domain/entities/quiz-answer.entity';
import { CurrentGameQuestion } from '../../../domain/entities/current-game-questions.entity';

@Injectable()
export class QuizQueryRepo {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,

    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,

    @InjectRepository(QuizPlayerProgress)
    private readonly playerProgresses: Repository<QuizPlayerProgress>,

    @InjectRepository(QuizAnswer)
    private readonly quizAnswers: Repository<QuizAnswer>,

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

  async getUserGames(
    userId: string,
    queryOptions?: QuizGamesQueryFilter,
  ): Promise<PaginationViewModel<QuizPairViewType>> {
    try {
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      // const subQueryAnswers =
      //   (alias: string) => (queryBuilder: SelectQueryBuilder<any>) =>
      //     this.quizAnswers
      //       .createQueryBuilder('answers')
      //       .select([
      //         'answers.questionId',
      //         'answers.answerStatus',
      //         'answers.created_at',
      //       ])
      //       .where(`${alias}.id = answers.playerProgressId`)
      //       .andWhere('answers.')
      //       .orderBy('answers.created_at', 'ASC');

      // const subQueryAnswers = (alias: string) => `
      //   SELECT answers."questionId", answers."answerStatus", answers."created_at"
      //   FROM quiz_answer answers
      //   WHERE answers."playerProgressId" = ${alias}.id
      //   ORDER BY answers."created_at" ASC
      // `;
      const queryBuilder = this.quizPairs.createQueryBuilder('game');
      const query = `
    SELECT 
    g.id, 
    g.status, 
    g."startGameDate", 
    g."finishGameDate", 
    g."created_at", 
    g."firstPlayerId", 
    g."secondPlayerId", 
    fPP.login AS "firstPlayerLogin", 
    fPP.score AS "firstPlayerScore", 
    sPP.login AS "secondPlayerLogin", 
    sPP.score AS "secondPlayerScore",
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', fA.id,
        'created_at', fA."created_at",
        'answerStatus', fA."answerStatus",
        'questionId', fA."questionId",
        'playerProgressId', fA."playerProgressId"
      ) ORDER BY fA."created_at"
    ) AS "firstPlayerAnswers",
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', sA.id,
        'created_at', sA."created_at",
        'answerStatus', sA."answerStatus",
        'questionId', sA."questionId",
        'playerProgressId', sA."playerProgressId"
      ) ORDER BY sA."created_at"
    ) AS "secondPlayerAnswers",
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'questionId', qg."questionId",
          'body', q."body"
        ) ORDER BY qg."order"
      )
      FROM current_game_question qg
      JOIN quiz_question q ON qg."questionId" = q.id
      WHERE qg."quizPairId" = g.id
    ) AS questions
  FROM 
    quiz_game g
  LEFT JOIN 
    quiz_player_progress fPP ON g."firstPlayerProgressId" = fPP.id
  LEFT JOIN 
    quiz_player_progress sPP ON g."secondPlayerProgressId" = sPP.id
  LEFT JOIN 
    quiz_answer fA ON fPP.id = fA."playerProgressId"
  LEFT JOIN 
    quiz_answer sA ON sPP.id = sA."playerProgressId"
  GROUP BY 
    g.id, fPP.login, fPP.score, sPP.login, sPP.score
  ORDER BY 
    g."created_at"
  `;
      // const res = this.dataSource.query(query);
      // res
      //   .then((res) => {
      //     console.log('res: ', res);
      //   })
      //   .catch((err) => {
      //     console.log(`err: ${err}`);
      //   });

      // queryBuilder
      //   .select([
      //     'game.id',
      //     'game.status',
      //     'game.startGameDate',
      //     'game.finishGameDate',
      //     'game.created_at',
      //     'game.firstPlayerId',
      //     'game.secondPlayerId',
      //   ])
      //   .where(
      //     `game.firstPlayerId = :userId OR game.secondPlayerId = :userId`,
      //     { userId }
      //   )
      //   .leftJoin('game.firstPlayerProgress', 'firstPlayerProgress')
      //   .addSelect(['firstPlayerProgress.login', 'firstPlayerProgress.score'])
      //   .leftJoin('game.secondPlayerProgress', 'secondPlayerProgress')
      //   .addSelect(['secondPlayerProgress.login', 'secondPlayerProgress.score'])
      //   .leftJoin('game.questions', 'currentGameQuestions')
      //   .leftJoin('currentGameQuestions.question', 'allQuestions')
      //   .addSelect([
      //     'currentGameQuestions.questionId',
      //     'currentGameQuestions.order',
      //     'allQuestions.id',
      //     'allQuestions.body',
      //   ])
      //   .leftJoinAndSelect('firstPlayerProgress.answers', 'fpAnswers')
      //   // .addSelect([
      //   //   'fpAnswers.id',
      //   //   'fpAnswers.created_at',
      //   //   'fpAnswers.answerStatus',
      //   //   'fpAnswers.questionId',
      //   // ])
      //   .leftJoinAndSelect('secondPlayerProgress.answers', 'spAnswers')
      //   // .addSelect([
      //   //   'spAnswers.id',
      //   //   'spAnswers.created_at',
      //   //   'spAnswers.answerStatus',
      //   //   'spAnswers.questionId',
      //   // ])
      //   .orderBy(`game.${sortBy}`, sortDirection || 'ASC')
      //   .addSelect(subQueryAnswers('firstPlayerProgress'), 'fpSubQuery')
      //   // .addSelect(subQueryAnswers('secondPlayerProgress'), 'spSubQuery')
      //   .skip(skip)
      //   .take(pageSize);

      // const [userGames, count] = await queryBuilder.getManyAndCount();

      // const [userGames, count] = await this.quizPairs.findAndCount({
      //   where: [
      //     { firstPlayerId: userId },
      //     { secondPlayerId: userId }
      //   ],
      //   order: {
      //     questions: {
      //       order: 'ASC',
      //     },
      //     firstPlayerProgress: {
      //       answers: {
      //         created_at: 'ASC',
      //       },
      //     },
      //     secondPlayerProgress: {
      //       answers: {
      //         created_at: 'ASC',
      //       },
      //     },
      //     sortBy: sortDirection || 'ASC',
      //   },
      //   relations: {
      //     questions: {
      //       question: true,
      //     },
      //     firstPlayerProgress: {
      //       answers: true,
      //     },
      //     secondPlayerProgress: {
      //       answers: true,
      //     },
      //   },
      //   skip,
      //   take: pageSize,
      // });

      queryBuilder
        .select([
          'game.id',
          'game.status',
          'game.startGameDate',
          'game.finishGameDate',
          'game.created_at',
          'game.firstPlayerId',
          'game.secondPlayerId',
          'firstPlayerProgress.login',
          'firstPlayerProgress.score',
          'secondPlayerProgress.login',
          'secondPlayerProgress.score',
          'currentGameQuestions.questionId',
          'currentGameQuestions.order',
          // 'allQuestions.id',
          // 'allQuestions.body',
        ])
        .leftJoin('game.firstPlayerProgress', 'firstPlayerProgress')
        .leftJoin('game.secondPlayerProgress', 'secondPlayerProgress')
        .leftJoinAndSelect('firstPlayerProgress.answers', 'fpAnswers')
        .leftJoinAndSelect('secondPlayerProgress.answers', 'spAnswers')
        .leftJoin('game.questions', 'currentGameQuestions')
        .leftJoinAndSelect('currentGameQuestions.question', 'allQuestions')
        // .addSelect(subQueryAnswers('firstPlayerProgress'), 'fpAnswers')
        // .addSelect(subQueryAnswers('secondPlayerProgress'), 'spAnswers')
        .where(
          'game.firstPlayerId = :userId OR game.secondPlayerId = :userId',
          { userId },
        )
        .orderBy(`game.${sortBy}`, sortDirection || 'ASC')
        // .addOrderBy('currentGameQuestions.order', 'ASC')
        .skip(skip)
        .take(pageSize);

      const [userGames, count] = await queryBuilder.getManyAndCount();

      await this.getAllGames(userId, queryOptions);

      // console.log(userGames);

      const gamesViewModel = new PaginationViewModel<QuizPairViewType>(
        userGames.map(getQuizPairViewModel),
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

  async test(user: UserAccount): Promise<any> {
    try {
      const userId = user?.id;
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination({});

      const queryBuilder = this.quizPairs.createQueryBuilder('game');

      queryBuilder
        .select([
          'game.id',
          'game.status',
          'game.startGameDate',
          'game.finishGameDate',
          'game.created_at',
          'game.firstPlayerId',
          'game.secondPlayerId',
        ])
        .where(
          `game.firstPlayerId = :userId OR game.secondPlayerId = :userId`,
          { userId },
        )
        .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
        .leftJoinAndSelect('game.secondPlayerProgress', 'secondPlayerProgress')
        .leftJoin('game.questions', 'gameQuestions')
        .leftJoin(
          (qb) =>
            qb
              .select(['gq.questionId', 'qq.body', 'gq.order'])
              .from(CurrentGameQuestion, 'gq')
              .innerJoin(QuizQuestion, 'qq', 'qq.id = gq.questionId')
              .orderBy('gq.order', 'ASC'),
          'sortedQuestions',
          'gameQuestions.questionId = sortedQuestions.questionId',
        );
      // .leftJoin('gameQuestions.question', 'allQuestions')
      // .addSelect([
      //   'gameQuestions.questionId',
      //   'allQuestions.id',
      //   'allQuestions.body',
      // ])
      // .leftJoinAndSelect(
      //   (qb) =>
      //     qb
      //       .from('QuizAnswer', 'fpAnswers')
      //       .where('fpAnswers.playerProgressId = firstPlayerProgress.id')
      //       .orderBy('fpAnswers.created_at', 'ASC'),
      //   'fpAnswers',
      //   'fpAnswers.playerProgressId = firstPlayerProgress.id',
      // )
      // .leftJoinAndSelect(
      //   (qb) =>
      //     qb
      //       .from('Answer', 'spAnswers')
      //       .where('spAnswers.playerProgressId = secondPlayerProgress.id')
      //       .orderBy('spAnswers.created_at', 'ASC'),
      //   'spAnswers',
      //   'spAnswers.playerProgressId = secondPlayerProgress.id',
      // )
      // .orderBy(`game.${sortBy}`, sortDirection || 'ASC')
      // .skip(skip)
      // .take(pageSize);

      const result = await queryBuilder.getMany();
      console.log(result);
      const view = result.map(getQuizPairViewModel);
      console.log(view);

      // return getQuizPairViewModel(result);
    } catch (error) {
      console.error(`TESTING: ${error}`);
    }
  }

  private async getAllGames(
    userId: string,
    queryOptions: QuizGamesQueryFilter,
  ) {
    await this.dataSource.query(
      `
  CREATE TEMP TABLE temp_fp_answers AS
  SELECT 
    answers.id,
    answers."created_at",
    answers."answerStatus",
    answers."questionId",
    answers."playerProgressId"
  FROM quiz_answer answers
  JOIN quiz_player_progress fPP ON fPP.id = answers."playerProgressId"
  WHERE fPP."playerId" = $1
  ORDER BY answers."created_at" ASC;
`,
      [userId],
    );

    await this.dataSource.query(
      `
      CREATE TEMP TABLE temp_sp_answers AS
      SELECT 
        answers.id,
        answers."created_at",
        answers."answerStatus",
        answers."questionId",
        answers."playerProgressId"
      FROM quiz_answer answers
      JOIN quiz_player_progress sPP ON sPP.id = answers."playerProgressId"
      WHERE sPP."playerId" = $1
      ORDER BY answers."created_at" ASC;
    `,
      [userId],
    );

    const { pageSize, sortBy, skip, sortDirection } =
      getPagination(queryOptions);

    const query = `
SELECT 
    game.id,
    game.status,
    game."startGameDate",
    game."finishGameDate",
    game."created_at",
    game."firstPlayerId",
    game."secondPlayerId",
    fPP.login AS "firstPlayerLogin",
    fPP.score AS "firstPlayerScore",
    sPP.login AS "secondPlayerLogin",
    sPP.score AS "secondPlayerScore",
    q."questionId",
    q."order" AS "questionOrder",
    allQuestions.id AS "questionId",
    allQuestions.body,
    fpAnswers.id AS "fpAnswerId",
    fpAnswers."created_at" AS "fpAnswerCreatedAt",
    fpAnswers."answerStatus" AS "fpAnswerStatus",
    fpAnswers."questionId" AS "fpAnswerQuestionId",
    spAnswers.id AS "spAnswerId",
    spAnswers."created_at" AS "spAnswerCreatedAt",
    spAnswers."answerStatus" AS "spAnswerStatus",
    spAnswers."questionId" AS "spAnswerQuestionId"
FROM quiz_game AS game
LEFT JOIN quiz_player_progress AS fPP 
    ON game."firstPlayerProgressId" = fPP.id
LEFT JOIN quiz_player_progress AS sPP 
    ON game."secondPlayerProgressId" = sPP.id
LEFT JOIN current_game_question AS q 
    ON game.id = q."quizPairId"
LEFT JOIN quiz_question AS allQuestions 
    ON q."questionId" = allQuestions.id
LEFT JOIN temp_fp_answers AS fpAnswers 
    ON fPP.id = fpAnswers."playerProgressId"
LEFT JOIN temp_sp_answers AS spAnswers 
    ON sPP.id = spAnswers."playerProgressId"
WHERE game."firstPlayerId" = $1 OR game."secondPlayerId" = $1
ORDER BY 
    game."${sortBy}" ${sortDirection}, 
    q."order" ASC,                    
    fpAnswers."created_at" ASC,        
    spAnswers."created_at" ASC         
LIMIT $2 OFFSET $3;
`;

    const result = await this.dataSource.query(query, [userId, pageSize, skip]);

    // console.log(result);
  }
}
