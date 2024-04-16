import { HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { PaginationViewModelType } from '../../../src/domain/pagination-view.model';
import { CreateQuestionData } from '../../../src/features/quiz/api/models/input.models/create-question.model';
import { QuizQuestionsQueryFilter } from '../../../src/features/quiz/api/models/input.models/quiz-questions-query.filter';
import { UpdateQuestionData } from '../../../src/features/quiz/api/models/input.models/update-question.model';
import { QuizQuestionViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-question.view-type';
import { QuizAnswer, QuizQuestion } from '../../../src/settings';
import { NavigationEnum } from '../helpers/routing';

export class QuizTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: NavigationEnum
  ) {}
  private application = this.app.getHttpServer();
  private quizQuestionRepository = this.app.get<Repository<QuizQuestion>>(
    getRepositoryToken(QuizQuestion)
  );
  private quizAnswerRepository = this.app.get<Repository<QuizAnswer>>(
    getRepositoryToken(QuizAnswer)
  );

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

  async getQuestionWithAnswers(questionId: string): Promise<{
    question: QuizQuestion;
    answers: QuizAnswer[];
  }> {
    const question = await this.quizQuestionRepository.findOne({
      where: { id: questionId },
    });

    const answers = await this.quizAnswerRepository.find({
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

  async createQuestionsForFurtherTests(numberOfQuestions: number) {
    const questionsAndAnswers = [];
    for (let i = 0; i < numberOfQuestions; i++) {
      const question = this.quizQuestionRepository.create({
        body: `Question ${i + 1}`,
        published: i % 3 === 0 ? true : false,
      });

      const savedQuestion = await this.quizQuestionRepository.save(question);

      const answers: QuizAnswer[] = [];

      for (let j = 0; j < 2; j++) {
        const answer = this.quizAnswerRepository.create({
          answerText: `Answer ${j + 1} for question ${i + 1}`,
          isCorrect: j === 0 ? true : false,
          question: { id: savedQuestion.id },
        });

        await this.quizAnswerRepository.save(answer);

        answers.push(answer);
      }
      questionsAndAnswers.push({ question, answers });
    }

    return questionsAndAnswers;
  }

  async getQuestions(
    query: QuizQuestionsQueryFilter
  ): Promise<PaginationViewModelType<QuizQuestionViewType>> {
    const response = await request(this.application)
      .get(this.routing)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .query(query)
      .expect(HttpStatus.OK);

    return response.body;
  }
}
