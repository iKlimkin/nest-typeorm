import {
  AppController,
  BlogsController,
  FeedbacksController,
  PostsController,
  SABlogsController,
  TestDatabaseController,
} from '.';
import { PairGameQuizController } from '../features/quiz/api/controllers/pair-game-quiz.controller';
import { QuizQuestionsController } from '../features/quiz/api/controllers/quiz-questions.controller';

export const controllers = [
  BlogsController,

  PostsController,

  FeedbacksController,

  SABlogsController,

  AppController,

  QuizQuestionsController,
  PairGameQuizController,

  TestDatabaseController,
];
