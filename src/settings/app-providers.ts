import { Provider } from '@nestjs/common';
import {
  BlogIdExistConstraint,
  BlogsQueryRepo,
  BlogsRepository,
  CreateBlogUseCase,
  CreateCommentUseCase,
  CreatePostUseCase,
  CreateQuestionUseCase,
  DeleteBlogUseCase,
  DeleteCommentUseCase,
  DeletePostUseCase,
  FeedbacksQueryRepo,
  FeedbacksRepository,
  PostsQueryRepo,
  PostsRepository,
  QuizRepository,
  TestDatabaseRepo,
  UpdateBlogUseCase,
  UpdateCommentReactionUseCase,
  UpdateCommentUseCase,
  UpdatePostReactionUseCase,
  UpdatePostUseCase,
} from '.';
import { QuizQueryRepo } from '../features/quiz/api/models/query-repositories/quiz.query.repo';
import { IsValidAnswersConstraint } from '../infra/decorators/validate/is-valid-answers';
import { UpdateQuestionUseCase } from '../features/quiz/application/use-cases/update-question.use-case';
import { DeleteQuestionUseCase } from '../features/quiz/application/use-cases/delete-question.use-case';

const testProviders: Provider[] = [TestDatabaseRepo];

const blogsProviders: Provider[] = [BlogsQueryRepo, BlogsRepository];

const postsProviders: Provider[] = [PostsRepository, PostsQueryRepo];

const feedbacksProviders: Provider[] = [
  FeedbacksRepository,
  FeedbacksQueryRepo,
];

const useCases: Provider[] = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,

  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  UpdatePostReactionUseCase,

  CreateCommentUseCase,
  UpdateCommentUseCase,
  UpdateCommentReactionUseCase,
  DeleteCommentUseCase,

  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  DeleteQuestionUseCase,
];

const quizProviders = [QuizRepository, QuizQueryRepo];

export const providers: Provider[] = [
  ...blogsProviders,
  ...postsProviders,
  ...feedbacksProviders,
  ...useCases,
  ...testProviders,
  ...quizProviders,
  BlogIdExistConstraint,
  IsValidAnswersConstraint,
];
