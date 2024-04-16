import { QuizQuestion } from '../../../../domain/entities/quiz-question.entity';
import { QuizQuestionViewType } from './quiz-question.view-type';

export const getQuestionsViewModel = (
  question: QuizQuestion
  //   answers?: QuizAnswer[]
): QuizQuestionViewType => ({
  id: question.id,
  body: question.body,
  correctAnswers: question.correctAnswers.map((ca) => ca.answerText),
  published: question.published,
  createdAt: question.created_at.toISOString(),
  updatedAt: question.updated_at?.toISOString() || new Date().toISOString(),
});
