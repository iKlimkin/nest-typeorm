import { Entity, ManyToOne, Column, JoinColumn } from 'typeorm';
import type { QuizQuestion } from './quiz-question.entity';
import { BaseEntity } from '../../../../domain/base-entity';

@Entity()
export class QuizAnswer extends BaseEntity {
  @ManyToOne('QuizQuestion', 'correctAnswers')
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column()
  answerText: string;

  @Column({ default: false })
  isCorrect: boolean;

  static create(correctAnswers: string[]): QuizAnswer[] {
    const answers: QuizAnswer[] = [];
    const doPush = Array.prototype.push.bind(answers);

    for (const correctAnswer of correctAnswers) {
      const quizAnswer = new QuizAnswer();
      quizAnswer.answerText = correctAnswer;
      quizAnswer.isCorrect = true;
      doPush(quizAnswer);
    }

    return answers;
  }
}
