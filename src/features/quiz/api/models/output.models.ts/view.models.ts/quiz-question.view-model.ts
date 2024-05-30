import { QuizAnswer } from '../../../../domain/entities/quiz-answer.entity';
import { QuizQuestion } from '../../../../domain/entities/quiz-questions.entity';
import { QuizQuestionViewType } from './quiz-question.view-type';

export const getQuestionViewModel = (
  question: QuizQuestion,
): QuizQuestionViewType => ({
  id: question.id,
  body: question.body,
  correctAnswers: question.correctAnswers.map((a) => a.answerText),
  published: question.published,
  createdAt: question.created_at.toISOString(),
  updatedAt: question.updated_at?.toISOString() || null,
});
