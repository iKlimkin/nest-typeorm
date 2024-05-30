import { Entity, ManyToOne, Column, JoinColumn, OneToMany } from 'typeorm';
import type { QuizQuestion } from './quiz-questions.entity';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizPlayerProgress } from './quiz-player-progress.entity';
import { AnswerStatus } from '../../api/models/input.models/statuses.model';
import { QuizCorrectAnswer } from './quiz-correct-answers.entity';

interface CreateAnswerData {
  answerText: string;
  isCorrect: boolean;
  questionId: string;
  playerProgress: QuizPlayerProgress;
}

@Entity()
export class QuizAnswer extends BaseEntity {
  @Column()
  answerText: string;

  @Column()
  questionId: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @ManyToOne('QuizPlayerProgress', 'answers', { onDelete: 'CASCADE' })
  @JoinColumn()
  playerProgress: QuizPlayerProgress;

  static create(createAnswerDto: CreateAnswerData) {
    const { answerText, isCorrect, questionId, playerProgress } =
      createAnswerDto;

    const answerStatus = isCorrect;
    const playerAnswer = new QuizAnswer();
    playerAnswer.answerText = answerText;
    playerAnswer.answerStatus = answerStatus
      ? AnswerStatus.Correct
      : AnswerStatus.Incorrect;
    playerAnswer.questionId = questionId;
    playerAnswer.playerProgress = playerProgress;

    return playerAnswer;
  }

  isCorrectAnswer() {
    return this.answerStatus === AnswerStatus.Correct;
  }
}
