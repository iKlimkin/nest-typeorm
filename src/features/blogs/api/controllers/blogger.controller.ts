import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import {
  AccessTokenGuard,
  CurrentUserInfo,
  UserSessionDto,
} from '../../../auth/api/controllers';
import {
  BlogCrudApiService,
  BlogPostsCrudApiService,
} from '../../application/base.crud.api.service';
import {
  BlogViewModelType,
  BlogsQueryFilter,
  BlogsQueryRepo,
  CreateBlogCommand,
  CreateBlogInputDto,
  CreatePostCommand,
  CreationPostDtoByBlogId,
  CurrentUserId,
  DeleteBloggerPostCommand,
  PaginationViewModel,
  PostViewModelType,
  PostsQueryFilter,
  PostsQueryRepo,
  SetUserIdGuard,
  UpdateBlogCommand,
  UpdateBlogInputDto,
  UpdatePostCommand,
} from './index';
import { DeleteBlogCommand } from '../../application/use-case/commands/delete-blog.command';
import { UpdateBloggerPostCommand } from '../../application/use-case/commands/blogger-update-post.command';

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

  @Get(':blogId/posts')
  async getPosts(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @CurrentUserId() userId: string,
    @Param('blogId') blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogWithUserInfo(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    if (userInfo.userId !== blog.user.id)
      throw new ForbiddenException(`User doesn't have permissions`);

    return this.postsQueryRepo.getPostsByBlogId(blogId, query, userId);
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
