import {
  UseGuards,
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import {
  BlogViewModelType,
  SABlogsViewType,
} from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { PostsQueryRepo } from '../../../posts/api/query-repositories/posts.query.repo';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { SetUserIdGuard } from '../../../auth/infrastructure/guards/set-user-id.guard';
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';

@Controller(RouterPaths.blogs)
export class BlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType | SABlogsViewType>> {
    return this.blogsQueryRepo.getAllBlogs(query);
  }

  @Get(':id')
  async getBlog(@Param('id') blogId: string): Promise<BlogViewModelType> {
    const result = await this.blogsQueryRepo.getById(blogId);
    if (!result) throw new NotFoundException('blog not found');
    return result;
  }

  @Get(':blogId/posts')
  @UseGuards(SetUserIdGuard)
  async getPosts(
    @Param('blogId') blogId: string,
    @CurrentUserId() userId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getById(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    return this.postsQueryRepo.getPostsByBlogId({
      blogId: blog.id,
      queryOptions: query,
      userId: userId,
    });
  }
}
