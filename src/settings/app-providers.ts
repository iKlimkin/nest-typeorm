import { Provider } from '@nestjs/common';
import {
  BanUnbanBloggerUseCase,
  BanUnbanBlogUseCase,
  BindUserWithBlogUseCase,
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
  DeleteBloggerPostUseCase,
  DeleteBlogUseCase,
  DeleteCommentUseCase,
  DeletePostUseCase,
  DeleteQuestionUseCase,
  FeedbacksQueryRepo,
  FeedbacksRepository,
  FileDimensionsValidationPipe,
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
import { FilesService } from '../features/files/application/services/file-metadata.service';
import { FilesCrudApiService } from '../features/files/application/services/files-crud-api.service';
import { FilesQueryRepository } from '../features/files/api/query.repo/files.query.repository';
import { UploadPostMainImageUseCase } from '../features/blogs/application/use-case/upload-post-main-image.use-case';
import { UploadBackgroundWallpaperUseCase } from '../features/blogs/application/use-case/upload-background-wallpaper.use-case';
import { UploadBlogMainImageUseCase } from '../features/blogs/application/use-case/upload-blog-main-image.use-case';

const testProviders: Provider[] = [TestDatabaseRepo];

const blogsProviders: Provider[] = [
  BlogsQueryRepo,
  BlogsRepository,
  BlogCrudApiService,

  BlogService,
];

const filesProviders = [
  FilesRepository,
  FilesQueryRepository,
  FilesService,
  FilesCrudApiService,
];

const adapters = [FilesStorageAdapter];

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
  BlogIdExistConstraint,
  IsValidAnswersConstraint,
  ValidateIdPipe,
  // FileDimensionsValidationPipe,
];
