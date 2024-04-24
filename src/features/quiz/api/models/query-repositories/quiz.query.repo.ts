import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Or, And, Repository } from 'typeorm';
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
  getQuizPairPendingViewModel,
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

      return getQuizPairPendingViewModel(result);
    } catch (error) {
      throw new InternalServerErrorException(`getPendingPairs: ${error}`);
    }
  }

  async getCurrentUnfinishedGame(
    userId: string
  ): Promise<QuizPairViewType | null> {
    try {
      const result = await this.quizPairs.findOne({
        where: [{ firstPlayerId: userId }, { secondPlayerId: userId }],
        relations: {
          questions: {
            question: true,
          },
          firstPlayerProgress: true,
          secondPlayerProgress: true,
        },
      });
      
      if (!result) return null;

      return getQuizPairViewModel(result);
    } catch (error) {
      throw new InternalServerErrorException(`getPendingPairs: ${error}`);
    }
  }

  async getPairInformation(gameId: string): Promise<QuizPairViewType> {
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
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      throw new InternalServerErrorException(
        `getPairInformation finished with errors: ${error}`
      );
    }
  }

  async test(user: UserAccount): Promise<any> {
    try {
      const gameId = '46362b94-6dde-4bc1-8245-0167e72205af';

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
        .leftJoin('game.firstPlayer', 'firstPlayer')
        // .leftJoinAndMapOne((qb) => {
        //   qb.from(QuizPlayerProgress, 'progress')
        //     .where('progress.gameId = :gameId')
        //     .andWhere('progress.userId = :userId');
        // })
        .addSelect(['firstPlayer.login', 'firstPlayer.score'])
        .leftJoin('game.secondPlayer', 'secondPlayer')
        .addSelect(['secondPlayer.login', 'secondPlayer.score'])
        .leftJoin('game.questions', 'questions')
        .where('game.id = :gameId', { gameId })
        .getOne();

      console.log(result);
    } catch (error) {
      console.error(`TESTING: ${error}`);
    }
  }
}
