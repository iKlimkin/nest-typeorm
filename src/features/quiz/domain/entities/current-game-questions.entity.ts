import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizGame } from './quiz-game.entity';
import type { QuizQuestion } from './quiz-questions.entity';

@Entity()
export class CurrentGameQuestion extends BaseEntity {
  @ManyToOne('QuizQuestion', 'gameQuestions')
  @JoinColumn()
  question: QuizQuestion;

  @Column()
  questionId: string;

  @ManyToOne('QuizGame', 'questions', { onDelete: 'CASCADE' })
  @JoinColumn()
  quizPair: QuizGame;

  @Column({ type: 'int2', default: 1 })
  order: number;

  static create() {}
}
