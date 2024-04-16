import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { PlayerProgress } from './quiz-player-progress.entity';
import type { QuizQuestion } from './quiz-question.entity';
import { GameStatus } from '../../api/models/input.models/statuses.model';

@Entity()
export class QuizGame extends BaseEntity {
  @OneToOne('PlayerProgress', 'game')
  @JoinColumn()
  firstPlayer: PlayerProgress;
  // @Column()
  // firstPlayerId: string

  @OneToOne('PlayerProgress', 'game', { nullable: true })
  @JoinColumn()
  secondPlayer: PlayerProgress | null;
  // @Column({ nullable: true })
  // secondPlayerId: string

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
