import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';
import type { QuizAnswer } from './quiz-answer.entity';
import type { QuizGame } from './quiz-game.entity';

@Entity()
export class QuizPlayerProgress extends BaseEntity {
  @OneToOne('UserAccount', 'gameProgress', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  player: UserAccount;

  @OneToOne('QuizGame', { nullable: true, onDelete: 'CASCADE' })
  // @JoinColumn()
  quizGame: QuizGame;

  @Column({ nullable: false })
  login: string;

  @OneToMany('QuizAnswer', 'playerProgress', { nullable: true })
  @JoinColumn()
  answers: QuizAnswer[];

  @Column({ type: 'int2', default: 0 })
  score: number;

  @Column({ type: 'int2', default: 0 })
  answersCount: number;

  @Column({ nullable: true })
  questCompletionDate: Date;

  static create(login: string, user: UserAccount) {
    const playerProgress = new QuizPlayerProgress();
    playerProgress.login = login;
    playerProgress.player = user;

    return playerProgress;
  }
}
