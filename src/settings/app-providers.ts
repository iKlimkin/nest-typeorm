import { Provider } from '@nestjs/common';
import { BlogsQueryRepo } from '../features/blogs/api/query-repositories/blogs.query.repo';
import { BlogsRepository } from '../features/blogs/infrastructure/blogs.repository';
import { UpdateBlogUseCase } from '../features/blogs/application/use-case/update-blog.use-case';
import { CreateBlogUseCase } from '../features/blogs/application/use-case/create-blog.use-case';
import { PostsQueryRepo } from '../features/posts/api/query-repositories/posts.query.repo';
import { PostsRepository } from '../features/posts/infrastructure/posts.repository';
import { UpdateSABlogUseCase } from '../features/blogs/application/use-case/update-sa-blog.use-case';
import { CreateBlogSAUseCase } from '../features/blogs/application/use-case/create-sa-blog.use-case';
import { DeleteBlogUseCase } from '../features/blogs/application/use-case/delete-blog.use-case';
import { DeleteSABlogUseCase } from '../features/blogs/application/use-case/delete-sa-blog.use-case';
import { CreatePostUseCase } from '../features/posts/application/use-cases/create-post.use-case';
import { UpdatePostUseCase } from '../features/posts/application/use-cases/update-post-use-case';

const blogsProviders: Provider[] = [BlogsQueryRepo, BlogsRepository];

const postsProviders: Provider[] = [PostsRepository, PostsQueryRepo];

const feedbacksProviders: Provider[] = [];

const useCases: Provider[] = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  DeleteSABlogUseCase,
  CreateBlogSAUseCase,
  UpdateSABlogUseCase,

  CreatePostUseCase,
  UpdatePostUseCase,
];

export const providers: Provider[] = [];
