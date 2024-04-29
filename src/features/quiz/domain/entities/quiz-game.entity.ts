import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  Unique,
  VersionColumn,
} from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import type { CurrentGameQuestion } from './current-game-questions.entity';
import type { QuizPlayerProgress } from './quiz-player-progress.entity';

@Entity()
@Unique(['firstPlayerId', 'secondPlayerId'])
export class QuizGame extends BaseEntity {
  @OneToOne('QuizPlayerProgress', 'quizGame')
  @JoinColumn()
  firstPlayerProgress: QuizPlayerProgress;
  @Column()
  firstPlayerId: string;

  @OneToOne('QuizPlayerProgress', 'quizGame', { nullable: true })
  @JoinColumn({ name: 'secondPlayerProgressId' })
  secondPlayerProgress: QuizPlayerProgress;
  @Column({ nullable: true })
  secondPlayerId: string;

  @OneToMany('CurrentGameQuestion', 'quizPair')
  @JoinColumn()
  questions: CurrentGameQuestion[];

  @Column()
  status: GameStatus;

  @Column({ type: 'timestamp', nullable: true })
  startGameDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishGameDate: Date | null;

  @VersionColumn({ default: 1 })
  version: number;
}
