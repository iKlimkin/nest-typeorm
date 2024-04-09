import { Provider } from '@nestjs/common';
import {
  BlogIdExistConstraint,
  BlogsQueryRepo,
  BlogsRepository,
  CreateBlogUseCase,
  CreateCommentUseCase,
  CreatePostUseCase,
  DeleteBlogUseCase,
  DeleteCommentUseCase,
  DeletePostUseCase,
  FeedbacksQueryRepo,
  FeedbacksRepository,
  PostsQueryRepo,
  PostsRepository,
  TestDatabaseRepo,
  UpdateBlogUseCase,
  UpdateCommentReactionUseCase,
  UpdateCommentUseCase,
  UpdatePostReactionUseCase,
  UpdatePostUseCase,
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
];

export const providers: Provider[] = [
  ...blogsProviders,
  ...postsProviders,
  ...feedbacksProviders,
  ...useCases,
  ...testProviders,
  BlogIdExistConstraint,
];
