import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizPair } from './quiz-pair.entity';
import type { QuizAnswer } from './quiz-answer.entity';

@Entity()
export class QuizQuestion extends BaseEntity {
  /**
   * Text of question
   */
  @Column()
  body: string;

  @OneToMany('QuizAnswer', 'question')
  correctAnswers: QuizAnswer[];

  @ManyToOne('QuizPair', 'questions')
  quizPair: QuizPair;

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
