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

  static create(user: UserAccount) {
    const playerProgress = new QuizPlayerProgress();
    playerProgress.login = user.login;
    playerProgress.player = user;

    return playerProgress;
  }

  incrementAnswersCount() {
    this.answersCount += 1;
  }

  incrementScore() {
    this.score += 1;
  }

  setCompletionDate() {
    this.questCompletionDate = new Date();
  }

  isGameCompleted(otherPlayerProgress: QuizPlayerProgress): boolean {
    return this.answersCount > 4 && otherPlayerProgress.answersCount > 4;
  }

  isCurrentPlayerFinishedEarlierThan(otherPlayer: QuizPlayerProgress): boolean {
    return (
      this.questCompletionDate.getTime() <
      otherPlayer.questCompletionDate.getTime()
    );
  }

  isExceededAnswerLimit(answerLimit: number): boolean {
    return this.answersCount >= answerLimit;
  }

  isLastAnswer(lastAnswerNumber: number): boolean {
    return this.answersCount === lastAnswerNumber;
  }

  isPlayerDeservesBonus(isFinishedEarly: boolean): boolean {
    return isFinishedEarly && this.score > 0;
  }
}
