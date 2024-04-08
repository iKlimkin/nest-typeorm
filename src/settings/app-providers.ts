import { Provider } from '@nestjs/common';
// import {
//   BlogsQueryRepo,
//   BlogsRepository,
//   CreateBlogUseCase,
//   CreateCommentUseCase,
//   CreatePostUseCase,
//   DeleteBlogUseCase,
//   DeleteCommentUseCase,
//   DeletePostUseCase,
//   FeedbacksQueryRepo,
//   FeedbacksRepository,
//   PostsQueryRepo,
//   PostsRepository,
//   UpdateBlogUseCase,
//   UpdateCommentReactionUseCase,
//   UpdateCommentUseCase,
//   UpdatePostReactionUseCase,
//   UpdatePostUseCase,
// } from '.';
import { BlogIdExistConstraint } from '../infra/decorators/validate/valid-blogId';
import { TestDatabaseRepo } from '../data-testing/test.db.repo';
import { BlogsQueryRepo } from '../features/blogs/api/query-repositories/blogs.query.repo';
import { PostsQueryRepo } from '../features/blogs/api/controllers';
import { CreateBlogUseCase } from '../features/blogs/application/use-case/create-blog.use-case';
import { DeleteBlogUseCase } from '../features/blogs/application/use-case/delete-blog.use-case';
import { UpdateBlogUseCase } from '../features/blogs/application/use-case/update-blog.use-case';
import { BlogsRepository } from '../features/blogs/infrastructure/blogs.repository';
import { FeedbacksQueryRepo } from '../features/comments/api/controllers';
import { CreateCommentUseCase } from '../features/comments/application/use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from '../features/comments/application/use-cases/delete-comment.use-case';
import { UpdateCommentReactionUseCase } from '../features/comments/application/use-cases/update-comment-reaction.use-case';
import { UpdateCommentUseCase } from '../features/comments/application/use-cases/update-comment.use-case';
import { FeedbacksRepository } from '../features/comments/infrastructure/feedbacks.repository';
import { CreatePostUseCase } from '../features/posts/application/use-cases/create-post.use-case';
import { DeletePostUseCase } from '../features/posts/application/use-cases/delete-post.use-case';
import { UpdatePostReactionUseCase } from '../features/posts/application/use-cases/update-post-reaction.use-case';
import { UpdatePostUseCase } from '../features/posts/application/use-cases/update-post.use-case';
import { PostsRepository } from '../features/posts/infrastructure/posts.repository';

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
