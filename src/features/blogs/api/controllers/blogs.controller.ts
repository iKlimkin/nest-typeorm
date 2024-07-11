import {
  UseGuards,
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import {
  BasicSAAuthGuard,
  PostsQueryFilter,
  PostsQueryRepo,
  PostViewModelType,
} from '../../../posts/api/controllers';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';

@Controller(RouterPaths.blogs)
export class BlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    return this.blogsQueryRepo.getAllBlogs(query);
  }

  @Get(':id')
  async getBlog(@Param('id') blogId: string): Promise<BlogViewModelType> {
    const result = await this.blogsQueryRepo.getById(blogId);
    if (!result) throw new NotFoundException('blog not found');
    return result;
  }

  @Get(':blogId/posts')
  async getPosts(
    @Param('blogId') blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getById(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    return this.postsQueryRepo.getPostsByBlogId(blogId, query);
  }
}
