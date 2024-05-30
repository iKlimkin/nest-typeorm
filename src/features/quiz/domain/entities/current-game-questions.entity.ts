import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { QuizGame } from './quiz-game.entity';
import type { QuizQuestion } from './quiz-questions.entity';

@Entity()
export class CurrentGameQuestion extends BaseEntity {
  @ManyToOne('QuizQuestion', 'gameQuestions')
  @JoinColumn()
  question: QuizQuestion;

  @Column()
  questionId: string;

  @ManyToOne('QuizGame', 'questions', { onDelete: 'CASCADE' })
  @JoinColumn()
  quizPair: QuizGame;

  @Column({ type: 'int2' })
  order: number;

  static createQuestionsBatch(
    quizPair: QuizGame,
    questions: QuizQuestion[],
  ): CurrentGameQuestion[] {
    return questions.map((q, i) => {
      return new CurrentGameQuestion().createQuestion(quizPair, q.id, i + 1);
    });
  }

  createQuestion(
    quizPair: QuizGame,
    questionId: string,
    order: number,
  ): CurrentGameQuestion {
    const gameQuestion = new CurrentGameQuestion();
    gameQuestion.quizPair = quizPair;
    gameQuestion.questionId = questionId;
    gameQuestion.order = order;
    return gameQuestion;
  }
}
