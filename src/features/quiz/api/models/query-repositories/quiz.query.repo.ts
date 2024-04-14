import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAnswer } from '../../../domain/entities/quiz-answer.entity';
import { QuizPair } from '../../../domain/entities/quiz-pair.entity';
import { QuizQuestion } from '../../../domain/entities/quiz-question.entity';
import { getQuestionViewModel } from '../view.models.ts/quiz-question.view-model';
import { QuizQuestionViewType } from '../view.models.ts/quiz-question.view-type';
import { QuizQuestionsQueryFilter } from '../input.models/quiz-questions-query.filter';
import { getPagination } from '../../../../../infra/utils/get-pagination';
import { PaginationViewModel } from '../../../../../domain/sorting-base-filter';
import { getQuestionsViewModel } from '../view.models.ts/quiz-questions.view-model';

@Injectable()
export class QuizQueryRepo {
  constructor(
    @InjectRepository(QuizPair)
    private readonly quizPairs: Repository<QuizPair>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswers: Repository<QuizAnswer>
  ) {}
  async getQuizQuestions(
    queryOptions: QuizQuestionsQueryFilter
  ): Promise<PaginationViewModel<QuizQuestionViewType>> {
    try {
      const { bodySearchTerm } = queryOptions;

      const filter = `%${bodySearchTerm ? bodySearchTerm : ''}%`;
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

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

      const [questions, count] = await queryBuilder.getManyAndCount();
      console.log(questions);

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
}
