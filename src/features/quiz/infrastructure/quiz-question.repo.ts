import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizPair } from '../domain/entities/quiz-pair.entity';
import { QuizQuestion } from '../domain/entities/quiz-question.entity';
import { QuizAnswer } from '../domain/entities/quiz-answer.entity';
import { getQuestionViewModel } from '../api/models/view.models.ts/quiz-question.view-model';
import { QuestionId } from '../api/models/output.models.ts/output.types';
import { UpdateQuestionData } from '../api/models/input.models/update-question.model';

@Injectable()
export class QuizRepository {
  constructor(
    // @InjectRepository(QuizPair)
    // private readonly quizPairs: Repository<QuizPair>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswers: Repository<QuizAnswer>
  ) {}

  async createQuestionAndAnswers(
    quizQuestion: QuizQuestion,
    quizAnswers: QuizAnswer[]
  ): Promise<QuestionId | null> {
    try {
      const savedQuestion = await this.quizQuestions.save(quizQuestion);

      const savedAnswers = await Promise.all(
        quizAnswers.map(async (answer) => {
          answer.question = savedQuestion;
          return await this.quizAnswers.save(answer);
        })
      );

      return {
        questionId: savedQuestion.id,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async updateQuestionAndAnswers(
    updateDto: UpdateQuestionData & { questionId: string }
  ): Promise<boolean> {
    try {
      const { body, correctAnswers, questionId } = updateDto;

      for (let i = 0; i < correctAnswers.length; i++) {
        const answerText = correctAnswers[i];
        const formerAnswers = await this.quizAnswers
          .createQueryBuilder('qa')
          .where('question_id = :questionId', { questionId })
          .getMany();

        let formerAnswer = formerAnswers[i];

        if (formerAnswer) {
          await this.quizAnswers.update(formerAnswer.id, { answerText });
        } else {
          const quizAnswer = this.quizAnswers.create({
            question: {
              id: questionId,
            },
            answerText,
            isCorrect: true,
          });
          await this.quizAnswers.save(quizAnswer);
        }
      }

      const result = await this.quizQuestions.update(
        {
          id: questionId,
        },
        { body, updated_at: new Date() }
      );

      return result.affected !== 0;
    } catch (error) {
      console.log(`updateQuestionAndAnswers: ${error}`);
      return false;
    }
  }
}
