import { Entity, ManyToOne, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizAnswer } from './quiz-answer.entity';
import type { QuizGame } from './quiz-game.entity';

@Entity()
export class PlayerProgress extends BaseEntity {
  @ManyToOne('QuizGame', { nullable: true, onDelete: 'CASCADE' })
  game: QuizGame;

  @Column({ nullable: false })
  login: string;

  @Column({ nullable: false })
  playerId: string;

  @OneToMany('QuizAnswer', 'playerProgress', { nullable: true })
  answers: QuizAnswer[];

  @Column({ type: 'int', default: 0 })
  score: number;

  static create(login: string, userId: string) {
    const playerProgress = new PlayerProgress();
    playerProgress.login = login;
    playerProgress.playerId = userId;

    return playerProgress;
  }
}
