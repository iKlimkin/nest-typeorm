import { Provider } from '@nestjs/common';
import {
  BlogIdExistConstraint,
  BlogsQueryRepo,
  BlogsRepository,
  ConnectPlayerUseCase,
  CreateBlogUseCase,
  CreateCommentUseCase,
  CreatePairUseCase,
  CreatePostUseCase,
  CreateQuestionUseCase,
  DeleteBlogUseCase,
  DeleteCommentUseCase,
  DeletePostUseCase,
  DeleteQuestionUseCase,
  FeedbacksQueryRepo,
  FeedbacksRepository,
  IsValidAnswersConstraint,
  PostsQueryRepo,
  PostsRepository,
  PublishQuestionUseCase,
  QuizCrudApiService,
  QuizQueryRepo,
  QuizRepository,
  QuizService,
  QuizTestService,
  SetPlayerAnswerUseCase,
  TestDatabaseRepo,
  UpdateBlogUseCase,
  UpdateCommentReactionUseCase,
  UpdateCommentUseCase,
  UpdatePostReactionUseCase,
  UpdatePostUseCase,
  UpdateQuestionUseCase,
  ValidateIdPipe,
} from '.';

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
  PublishQuestionUseCase,

  CreatePairUseCase,
  ConnectPlayerUseCase,
  SetPlayerAnswerUseCase,
];

const quizProviders = [
  QuizRepository,
  QuizQueryRepo,
  QuizService,
  QuizTestService,
  QuizCrudApiService,
];

export const providers: Provider[] = [
  ...blogsProviders,
  ...postsProviders,
  ...feedbacksProviders,
  ...useCases,

  ...testProviders,
  ...quizProviders,
  BlogIdExistConstraint,
  IsValidAnswersConstraint,
  ValidateIdPipe,
];
