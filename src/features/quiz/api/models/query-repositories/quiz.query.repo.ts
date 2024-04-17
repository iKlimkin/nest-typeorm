import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Or, And, Repository, createQueryBuilder } from 'typeorm';
import { QuizAnswer } from '../../../domain/entities/quiz-answer.entity';
import { QuizGame } from '../../../domain/entities/quiz-game.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-question.entity';
import { getQuestionViewModel } from '../output.models.ts/view.models.ts/quiz-question.view-model';
import { QuizQuestionViewType } from '../output.models.ts/view.models.ts/quiz-question.view-type';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getQuestionsViewModel } from '../output.models.ts/view.models.ts/quiz-questions.view-model';
import { GameStatus } from '../input.models/statuses.model';
import { getQuizPairViewModel } from '../output.models.ts/view.models.ts/quiz-pair.view-model';
import { get } from 'http';
import { QuizPairViewType } from '../output.models.ts/view.models.ts/quiz-game.view-type';
import { relative } from 'path';

@Injectable()
export class QuizQueryRepo {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>
    // @InjectRepository(QuizAnswer)
    // private readonly quizAnswers: Repository<QuizAnswer>
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
        .leftJoin('game.firstPlayer', 'fP')
        .leftJoin('game.secondPlayer', 'sP')
        .where('(fP.id = :userId OR sP.id = :userId)', { userId })
        .getCount();

      return !!result;
    } catch (error) {
      console.log(`isUserInGame: ${error}`);
      return false;
    }
  }

  async getPendingPairs(): Promise<QuizPairViewType[]> {
    try {
      const pendingPairs = await this.quizPairs.find({
        where: { status: GameStatus.PendingSecondPlayer },
      });

      return pendingPairs.map(getQuizPairViewModel);
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
        ])
        .leftJoin('game.firstPlayer', 'firstPlayer')
        .addSelect(['firstPlayer.id', 'firstPlayer.login'])
        .leftJoin('game.secondPlayer', 'secondPlayer')
        .addSelect(['secondPlayer.id', 'secondPlayer.login'])
        .leftJoin('firstPlayer.gameProgress', 'firstPlayerProgress')
        .addSelect('firstPlayerProgress.score')
        .leftJoin('secondPlayer.gameProgress', 'secondPlayerProgress')
        .addSelect('secondPlayerProgress.score')
        .where('game.id = :gameId', { gameId })
        .getOne();

      return getQuizPairViewModel(result);
    } catch (error) {
      throw new InternalServerErrorException(
        `getPairInformation finished with errors: ${error}`
      );
    }
  }
}
