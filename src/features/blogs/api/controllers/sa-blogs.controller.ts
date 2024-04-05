import {
  Body,
  Controller,
  Delete,
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
import { CommandBus } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { InputPostModelByBlogId } from '../../../posts/api/models/input.posts.models/create.post.model';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { PostsQueryRepo } from '../../../posts/api/query-repositories/posts.query.repo';
import { CreatePostCommand } from '../../../posts/application/use-cases/commands/create-post-sql.command';
import { DeletePostSqlCommand } from '../../../posts/application/use-cases/commands/delete-post-sql.command';
import { UpdatePostSqlCommand } from '../../../posts/application/use-cases/commands/update-post.command';
import { CreateSABlogCommand } from '../../application/use-case/commands/create-sa-blog.command';

import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { SetUserIdGuard } from '../../../auth/infrastructure/guards/set-user-id.guard';
import { CreateBlogInputDto } from '../models/input.blog.models/create.blog.model';
import { UpdateBlogInputDto } from '../models/input.blog.models/update-blog-models';
import { UpdateBlogCommand } from '../../application/use-case/commands/update-blog.command';
import { UpdateSABlogCommand } from '../../application/use-case/commands/update-sa-blog.command';
import { DeleteSABlogCommand } from '../../application/use-case/commands/delete-sa-blog.command';

// @UseGuards(AccessTokenGuard)
@UseGuards(BasicSAAuthGuard)
@Controller('sa/blogs')
export class SABlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    const result = await this.blogsQueryRepo.getAllBlogs(query);

    if (!result) throw new Error();

    return result;
  }

  @Get(':id')
  async getBlogById(@Param('id') blogId: string): Promise<BlogViewModelType> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    return blog;
  }

  @Get(':blogId/posts')
  @UseGuards(SetUserIdGuard)
  async getPosts(
    //@CurrentUserInfo() userInfo: UserInfoType,
    @CurrentUserId() userId: string,
    @Param('blogId') blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    // if (userInfo.userId !== blog.ownerInfo.userId)
    //   throw new ForbiddenException();

    const posts = await this.postsQueryRepo.getPostsByBlogId(
      blogId,
      query,
      userId,
      // userInfo.userId,
    );

    if (!posts) throw new Error();

    return posts;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto,
    //@CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<BlogViewModelType> {
    const command = new CreateSABlogCommand({
      ...data,
      // userId: userInfo.userId,
    });

    const blog = await this.commandBus.execute<
      CreateSABlogCommand,
      OutputId | null
    >(command);

    return (await this.blogsQueryRepo.getBlogById(blog.id))!;
  }

  @Post(':id/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Param('id') blogId: string,
    @Body() body: InputPostModelByBlogId,
    //@CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<PostViewModelType> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    // if (userInfo.userId !== blog.ownerInfo.userId) {
    //   throw new ForbiddenException();
    // }

    const command = new CreatePostCommand({
      ...body,
      blogId,
      blogTitle: blog.name,
    });

    const post = await this.commandBus.execute<
      CreatePostCommand,
      LayerNoticeInterceptor<OutputId | null>
    >(command);

    if (post.hasError()) {
      const errors = handleErrors(post.code, post.extensions[0]);
      throw errors.error;
    }

    const result = await this.postsQueryRepo.getPostById(post.data!.id);

    if (!result) throw new NotFoundException();

    return result;
  }

  @Put(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') blogId: string,
    @Param('postId') postId: string,
    @Body() inputPostModel: InputPostModelByBlogId,
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!blog || !post) throw new NotFoundException();

    //if (userInfo.userId !== blog.ownerInfo.userId)
    // throw new ForbiddenException();

    const command = new UpdatePostSqlCommand({
      ...inputPostModel,
      postId,
    });

    await this.commandBus.execute(command);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    //@CurrentUserInfo() userInfo: UserInfoType,
    @Body() data: UpdateBlogInputDto,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    // if (userInfo.userId !== blog.ownerInfo.userId) {
    //   throw new ForbiddenException();
    // }

    const command = new UpdateSABlogCommand({ ...data, blogId });

    const result = await this.commandBus.execute<
      UpdateBlogCommand,
      LayerNoticeInterceptor<boolean>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions);
      throw errors.error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param('id') blogId: string,
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    // if (userInfo.userId !== blog.ownerInfo.userId) {
    //   throw new ForbiddenException();
    // }

    const command = new DeleteSABlogCommand(blogId);
    await this.commandBus.execute(command);
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('id') blogId: string,
    @Param('postId') postId: string,
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!blog || !post) throw new NotFoundException();

    //if (userInfo.userId !== blog.ownerInfo.userId)
    // throw new ForbiddenException();

    const command = new DeletePostSqlCommand(postId);
    await this.commandBus.execute(command);
  }
}
