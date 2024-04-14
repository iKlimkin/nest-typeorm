import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';
import type { QuizQuestion } from './quiz-question.entity';

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}

@Entity()
export class QuizPair extends BaseEntity {
  @OneToOne('UserAccount', 'quizPairs')
  @JoinColumn()
  firstPlayer: UserAccount;

  @OneToOne('UserAccount', 'quizPair')
  @JoinColumn()
  secondPlayer: UserAccount;

  @OneToMany('QuizQuestion', 'quizPair', { eager: true })
  @JoinColumn()
  questions: QuizQuestion[];

  @Column({ type: 'enum', enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @Column({ type: 'int' })
  score: number;

  @Column()
  status: GameStatus;

  @Column({ type: 'timestamp', nullable: true })
  startGameDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishGameDate: Date;
}
