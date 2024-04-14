import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
