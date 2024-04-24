import { Entity, ManyToOne, Column, JoinColumn, OneToMany } from 'typeorm';
import type { QuizQuestion } from './quiz-questions.entity';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizPlayerProgress } from './quiz-player-progress.entity';
import { AnswerStatus } from '../../api/models/input.models/statuses.model';

@Entity()
export class QuizAnswer extends BaseEntity {
  @Column()
  answerText: string;

  @Column()
  questionId: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @ManyToOne('QuizPlayerProgress', 'answers')
  @JoinColumn()
  playerProgress: QuizPlayerProgress;

  static createAnswer() {
    const answerInfo = new QuizAnswer();
  }
}
