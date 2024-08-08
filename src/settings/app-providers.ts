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
import { SubscribeBlogUseCase } from '../features/blogs/application/use-case/subscribe-blog.use-case';
import { UnsubscribeBlogUseCase } from '../features/blogs/application/use-case/unSubscribe-blog.use-case';
import { UploadBackgroundWallpaperUseCase } from '../features/blogs/application/use-case/upload-background-wallpaper.use-case';
import { UploadBlogMainImageUseCase } from '../features/blogs/application/use-case/upload-blog-main-image.use-case';
import { UploadPostMainImageUseCase } from '../features/blogs/application/use-case/upload-post-main-image.use-case';
import { FilesQueryRepository } from '../features/files/api/query.repo/files.query.repository';
import { FilesService } from '../features/files/application/services/file-metadata.service';
import { FilesCrudApiService } from '../features/files/application/services/files-crud-api.service';
import { SetWebhookTelegramBotUseCase } from '../features/integrations/application/use-cases/set-hook-telegram-bot.use-case';
import { HandleTelegramUpdatesUseCase } from '../features/integrations/application/use-cases/telegram-updates-handle.use-case';
import { TelegramAdapter } from '../infra/adapters/telegram.adapter';
import { GenerateAuthLinkTelegramBotUseCase } from '../features/integrations/application/use-cases/generate-auth-link-telegram-bot.use-case';
import { IntegrationsRepository } from '../features/integrations/infrastructure/integrations.repository';
import { LinkUserToTelegramBotUseCase } from '../features/integrations/application/use-cases/link-user-to-telegram-bot.use-case';
import { TelegramCrudApiService } from '../features/integrations/application/tg-for-webhook-update.service';
import { BlogService } from '../features/blogs/application/blog.service';
import { BlogsCrudApiService } from '../features/blogs/application/services/blogs-crud-api.service';
import { NotifySubscribersEventHandler } from '../features/blogs/application/events/created-post-notify.event';

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
];

const telegramProviders: Provider[] = [
  SetWebhookTelegramBotUseCase,
  HandleTelegramUpdatesUseCase,
  GenerateAuthLinkTelegramBotUseCase,
  IntegrationsRepository,
  LinkUserToTelegramBotUseCase,
  TelegramCrudApiService,
];

const adapters = [FilesStorageAdapter, TelegramAdapter];

const events = [NotifySubscribersEventHandler];

const postsProviders: Provider[] = [
  PostsRepository,
  PostsQueryRepo,
  PostsService,
  BlogPostsCrudApiService,
  PostCrudApiService,
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
  SubscribeBlogUseCase,
  UnsubscribeBlogUseCase,
  HandleTelegramUpdatesUseCase,

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
  ...telegramProviders,
  ...events,
  // BlogsQueryRepo,
  // BlogIdExistConstraint,
  IsValidAnswersConstraint,
  ValidateIdPipe,
  TelegramAdapter,
  // FileDimensionsValidationPipe,
];
