import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizQuestion } from './quiz-questions.entity';

@Entity()
export class QuizCorrectAnswer extends BaseEntity {
  @Column()
  answerText: string;

  @ManyToOne('QuizQuestion', 'correctAnswers', { onDelete: 'CASCADE' })
  @JoinColumn()
  question: QuizQuestion;

  static create(correctAnswers: string[]): QuizCorrectAnswer[] {
    const answers: QuizCorrectAnswer[] = [];
    const doPush = Array.prototype.push.bind(answers);

    for (const correctAnswer of correctAnswers) {
      const quizAnswer = new QuizCorrectAnswer();
      quizAnswer.answerText = correctAnswer;
      doPush(quizAnswer);
    }

    return answers;
  }

  isCorrectAnswer(answer: string): boolean {
    return this.answerText === answer;
  }
}
