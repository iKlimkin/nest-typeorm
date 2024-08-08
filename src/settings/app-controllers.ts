import {
  AppController,
  BloggerController,
  BlogsController,
  FeedbacksController,
  PairGameQuizController,
  PostsController,
  QuizQuestionsController,
  SABlogsController,
  TestDatabaseController,
} from '.';
import { TelegramController } from '../features/integrations/api/controllers/telegram.controller';

export const controllers = [
  BloggerController,
  SABlogsController,
  BlogsController,
  TelegramController,
  PostsController,

  FeedbacksController,

  AppController,

  QuizQuestionsController,
  PairGameQuizController,

  TestDatabaseController,
];
