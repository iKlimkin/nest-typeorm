import { Entity, ManyToOne, Column, JoinColumn, OneToMany } from 'typeorm';
import type { QuizQuestion } from './quiz-question.entity';
import { BaseEntity } from '../../../../domain/base-entity';
import type { PlayerProgress } from './quiz-player-progress.entity';
import { AnswerStatus } from '../../api/models/input.models/statuses.model';

@Entity()
export class QuizAnswer extends BaseEntity {
  @ManyToOne('QuizQuestion', 'correctAnswers')
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column()
  answerText: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'enum', enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @OneToMany('PlayerProgress', 'answers')
  @JoinColumn()
  playerProgress: PlayerProgress;

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
