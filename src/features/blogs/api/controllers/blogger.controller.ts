import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
// import {
//   AccessTokenGuard,
//   // BlogCrudApiService,
//   // BlogPostsCrudApiService,
//   BlogViewModelType,
//   BlogsQueryFilter,
//   BlogsQueryRepo,
//   CreateBlogCommand,
//   CreateBlogInputDto,
//   CreatePostCommand,
//   CreationPostDtoByBlogId,
//   CurrentUserInfo,
//   DeleteBlogCommand,
//   DeleteBloggerPostCommand,
//   PaginationViewModel,
//   PostViewModelType,
//   PostsQueryFilter,
//   PostsQueryRepo,
//   RouterPaths,
//   UpdateBlogCommand,
//   UpdateBlogInputDto,
//   UpdateBloggerPostCommand,
//   UserSessionDto,
// } from './index';
import {
  BlogCrudApiService,
  BlogPostsCrudApiService,
} from '../../application/base.crud.api.service';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { PostsQueryRepo } from '../../../posts/api/query-repositories/posts.query.repo';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { CreationPostDtoByBlogId } from '../../../posts/api/models/input.posts.models/create.post.model';
import { CreatePostCommand } from '../../../posts/application/use-cases/commands/create-post.command';
import { CreateBlogCommand } from '../../application/use-case/commands/create-blog.command';
import { CreateBlogInputDto } from '../models/input.blog.models/create.blog.model';
import { UpdateBlogCommand } from '../../application/use-case/commands/update-blog.command';
import { UpdateBlogInputDto } from '../models/input.blog.models/update-blog-models';
import { UpdateBloggerPostCommand } from '../../application/use-case/commands/blogger-update-post.command';
import { DeleteBloggerPostCommand } from '../../application/use-case/commands/delete-blogger-blog.command';
import { DeleteBlogCommand } from '../../application/use-case/commands/delete-blog.command';

@UseGuards(AccessTokenGuard)
@Controller(RouterPaths.blogger)
export class BloggerController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
    private blogCrudApiService: BlogCrudApiService<any>,
    private blogPostsCrudApiService: BlogPostsCrudApiService<any>,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    return this.blogsQueryRepo.getBlogsByBlogger(userInfo.userId, query);
  }

  @Get(':id/posts')
  async getPosts(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('id') blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogWithUserInfo(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    if (userInfo.userId !== blog.user.id)
      throw new ForbiddenException(`User doesn't have permissions`);

    return this.postsQueryRepo.getPostsByBlogId({
      blogId: blog.id,
      queryOptions: query,
      userId: userInfo?.userId,
    });
  }

  @Post(':id/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Param('id') blogId: string,
    @Body() body: CreationPostDtoByBlogId,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PostViewModelType> {
    const command = new CreatePostCommand({
      ...body,
      userId: userInfo.userId,
      blogId,
    });
    return this.blogPostsCrudApiService.create(command);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand({
      ...data,
      userId: userInfo.userId,
    });

    return this.blogCrudApiService.create(command);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() data: UpdateBlogInputDto,
  ) {
    const command = new UpdateBlogCommand({
      ...data,
      blogId,
      userId: userInfo.userId,
    });
    return this.blogCrudApiService.updateOrDelete(command);
  }

  @Put(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') blogId: string,
    @Param('postId') postId: string,
    @Body() data: CreationPostDtoByBlogId,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const command = new UpdateBloggerPostCommand({
      ...data,
      postId,
      blogId,
      userId: userInfo.userId,
    });
    return this.blogPostsCrudApiService.updateOrDelete(command);
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    const command = new DeleteBloggerPostCommand({
      blogId,
      postId,
      userId: userInfo.userId,
    });
    return this.blogPostsCrudApiService.updateOrDelete(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const command = new DeleteBlogCommand({ blogId, userId: userInfo.userId });
    return this.blogCrudApiService.updateOrDelete(command);
  }
}
