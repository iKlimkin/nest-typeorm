import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { CurrentGameQuestion } from './current-game-questions.entity';
import type { QuizCorrectAnswer } from './quiz-correct-answers.entity';

@Entity()
export class QuizQuestion extends BaseEntity {
  /**
   * Text of question
   */
  @Column()
  body: string;

  @OneToMany('QuizCorrectAnswer', 'question')
  @JoinColumn()
  correctAnswers: QuizCorrectAnswer[];

  @OneToMany('CurrentGameQuestion', 'question')
  gameQuestions: CurrentGameQuestion[];

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  static create(questionData: string): QuizQuestion {
    const quizQuestion = new QuizQuestion();
    quizQuestion.body = questionData;

    return quizQuestion;
  }
}
