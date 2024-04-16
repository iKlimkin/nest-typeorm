import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizGame } from './quiz-game.entity';
import type { QuizAnswer } from './quiz-answer.entity';

@Entity()
export class QuizQuestion extends BaseEntity {
  /**
   * Text of question
   */
  @Column()
  body: string;

  @OneToMany('QuizAnswer', 'question', { onDelete: 'CASCADE' })
  correctAnswers: QuizAnswer[];

  @ManyToOne('QuizGame', 'questions')
  quizPair: QuizGame;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  static create(questionData: string): QuizQuestion {
    const quizQuestion = new QuizQuestion();
    quizQuestion.body = questionData;
    quizQuestion.updated_at = new Date();

    return quizQuestion;
  }
}
