import { Provider } from '@nestjs/common';
import {
  BlogCrudApiService,
  BlogIdExistConstraint,
  BlogPostsCrudApiService,
  BlogService,
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
  QuizScheduleService,
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
import { BindUserWithBlogUseCase } from '../features/blogs/application/use-case/bind-user-with-blog.use-case';
import { DeleteBloggerPostUseCase } from '../features/blogs/application/use-case/delete-blogger-post.use-case';
import { UpdateBloggerPostUseCase } from '../features/blogs/application/use-case/blogger-update-post.use-case';

const testProviders: Provider[] = [TestDatabaseRepo];

const blogsProviders: Provider[] = [
  BlogsQueryRepo,
  BlogsRepository,
  BlogCrudApiService,
  BlogService,
];

const postsProviders: Provider[] = [
  PostsRepository,
  PostsQueryRepo,
  BlogPostsCrudApiService,
];

const feedbacksProviders: Provider[] = [
  FeedbacksRepository,
  FeedbacksQueryRepo,
];

const useCases: Provider[] = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  BindUserWithBlogUseCase,
  DeleteBloggerPostUseCase,
  UpdateBloggerPostUseCase,

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
  QuizScheduleService,
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
