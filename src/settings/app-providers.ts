import { Provider } from '@nestjs/common';
import {
  BanUnbanBloggerUseCase,
  BanUnbanBlogUseCase,
  BindUserWithBlogUseCase,
  BlogCrudApiService,
  BlogPostsCrudApiService,
  BlogsRepository,
  ConnectPlayerUseCase,
  CreateBlogUseCase,
  CreateCommentUseCase,
  CreatePairUseCase,
  CreatePostUseCase,
  CreateQuestionUseCase,
  DeleteBloggerPostUseCase,
  DeleteBlogUseCase,
  DeleteCommentUseCase,
  DeletePostUseCase,
  DeleteQuestionUseCase,
  FeedbacksQueryRepo,
  FeedbacksRepository,
  FilesRepository,
  FilesStorageAdapter,
  IsValidAnswersConstraint,
  PostCrudApiService,
  PostsQueryRepo,
  PostsRepository,
  PostsService,
  PublishQuestionUseCase,
  QuizCrudApiService,
  QuizQueryRepo,
  QuizRepository,
  QuizScheduleService,
  QuizService,
  QuizTestService,
  SetPlayerAnswerUseCase,
  TestDatabaseRepo,
  UpdateBloggerPostUseCase,
  UpdateBlogUseCase,
  UpdateCommentReactionUseCase,
  UpdateCommentUseCase,
  UpdatePostReactionUseCase,
  UpdatePostUseCase,
  UpdateQuestionUseCase,
  ValidateIdPipe,
} from '.';
import { BlogService } from '../features/blogs/application/blog.service';
import { BlogsCrudApiService } from '../features/blogs/application/services/blogs-crud-api.service';
import { SubscribeBlogUseCase } from '../features/blogs/application/use-case/subscribe-blog.use-case';
import { UnsubscribeBlogUseCase } from '../features/blogs/application/use-case/unSubscribe-blog.use-case';
import { UploadBackgroundWallpaperUseCase } from '../features/blogs/application/use-case/upload-background-wallpaper.use-case';
import { UploadBlogMainImageUseCase } from '../features/blogs/application/use-case/upload-blog-main-image.use-case';
import { UploadPostMainImageUseCase } from '../features/blogs/application/use-case/upload-post-main-image.use-case';
import { FilesQueryRepository } from '../features/files/api/query.repo/files.query.repository';
import { FilesScheduleService } from '../features/files/application/services/file-metadata.schedule.service';
import { FilesService } from '../features/files/application/services/file-metadata.service';
import { FilesCrudApiService } from '../features/files/application/services/files-crud-api.service';
import { CreateBlogMembershipPlansEventHandler } from '../features/blogs/application/events/create-blog-membership-plans.event-handler';
import { JoinTheMembershipPlanUseCase } from '../features/blogs/application/use-case/join-membership-plan.use.case';
import { GoogleStrategy } from '../features/auth/infrastructure/guards/strategies/google.strategy';
import { GithubStrategy } from '../features/auth/infrastructure/guards/strategies/github.strategy';

const testProviders: Provider[] = [TestDatabaseRepo];

const blogsProviders: Provider[] = [
  BlogsRepository,
  BlogCrudApiService,
  BlogService,
  BlogsCrudApiService,
];

const filesProviders = [
  FilesRepository,
  FilesQueryRepository,
  FilesService,
  FilesCrudApiService,
  FilesScheduleService,
];

const adapters = [FilesStorageAdapter];

const events = [];

const postsProviders: Provider[] = [
  PostsRepository,
  PostsQueryRepo,
  PostsService,
  BlogPostsCrudApiService,
  PostCrudApiService,
];

const googleGithubStrategies = [GoogleStrategy, GithubStrategy];

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
  SubscribeBlogUseCase,
  UnsubscribeBlogUseCase,
  JoinTheMembershipPlanUseCase,

  UploadBackgroundWallpaperUseCase,
  UploadBlogMainImageUseCase,
  UploadPostMainImageUseCase,

  BanUnbanBloggerUseCase,
  BanUnbanBlogUseCase,

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
  ...adapters,
  ...testProviders,
  ...quizProviders,
  ...filesProviders,
  ...events,
  ...googleGithubStrategies,
  IsValidAnswersConstraint,
  ValidateIdPipe,
];
