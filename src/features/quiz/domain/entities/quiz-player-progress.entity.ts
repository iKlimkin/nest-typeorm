import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';
import type { QuizAnswer } from './quiz-answer.entity';

@Entity()
export class PlayerProgress extends BaseEntity {
  @OneToOne('UserAccount', 'gameProgress', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  player: UserAccount;

  @Column({ nullable: false })
  login: string;

  // @Column({ nullable: false })
  // playerId: string;

  @OneToMany('QuizAnswer', 'playerProgress', { nullable: true })
  answers: QuizAnswer[];

  @Column({ type: 'int', default: 0 })
  score: number;

  static create(login: string, userId: string) {
    const playerProgress = new PlayerProgress();
    playerProgress.login = login;

    return playerProgress;
  }
}
