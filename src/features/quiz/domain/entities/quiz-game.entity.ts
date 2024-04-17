import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import type { QuizQuestion } from './quiz-question.entity';

@Entity()
export class QuizGame extends BaseEntity {
  @OneToOne('UserAccount', 'quizGame')
  @JoinColumn()
  firstPlayer: UserAccount;

  @OneToOne('UserAccount', 'quizGame', { nullable: true })
  @JoinColumn()
  secondPlayer: UserAccount | null;

  @OneToMany('QuizQuestion', 'quizPair', { eager: true })
  @JoinColumn()
  questions: QuizQuestion[];

  @Column()
  status: GameStatus;

  @Column({ type: 'timestamp', nullable: true })
  startGameDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishGameDate: Date | null;
}
