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
import {
  OutputId,
  PaginationViewModel,
  CurrentUserId,
  BasicSAAuthGuard,
  SetUserIdGuard,
  PostsQueryFilter,
  PostViewModelType,
  PostsQueryRepo,
  CreateBlogCommand,
  DeleteBlogCommand,
  UpdateBlogCommand,
  BlogsQueryFilter,
  CreateBlogInputDto,
  UpdateBlogInputDto,
  BlogViewModelType,
  BlogsQueryRepo,
  LayerNoticeInterceptor,
  handleErrors,
  CreationPostDto,
  CreationPostDtoByBlogId,
  CreatePostCommand,
  DeletePostCommand,
  UpdatePostCommand,
} from './index';

// @UseGuards(AccessTokenGuard)
@UseGuards(BasicSAAuthGuard)
@Controller('sa/blogs')
export class SABlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
    private readonly commandBus: CommandBus
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter
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
    @Query() query: PostsQueryFilter
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    // if (userInfo.userId !== blog.ownerInfo.userId)
    //   throw new ForbiddenException();

    const posts = await this.postsQueryRepo.getPostsByBlogId(
      blogId,
      query,
      userId
      // userInfo.userId,
    );

    if (!posts) throw new Error();

    return posts;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto
    //@CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand({
      ...data,
      // userId: userInfo.userId,
    });

    const blog = await this.commandBus.execute<
      CreateBlogCommand,
      OutputId | null
    >(command);

    const newestBlog = await this.blogsQueryRepo.getBlogById(blog.id);

    return newestBlog;
  }

  @Post(':id/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Param('id') blogId: string,
    @Body() body: CreationPostDtoByBlogId
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

    if (post.hasError) {
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
    @Body() data: CreationPostDtoByBlogId
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!blog || !post) throw new NotFoundException();

    //if (userInfo.userId !== blog.ownerInfo.userId)
    // throw new ForbiddenException();

    const command = new UpdatePostCommand({
      ...data,
      postId,
    });

    await this.commandBus.execute(command);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    //@CurrentUserInfo() userInfo: UserInfoType,
    @Body() data: UpdateBlogInputDto
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    // if (userInfo.userId !== blog.ownerInfo.userId) {
    //   throw new ForbiddenException();
    // }

    const command = new UpdateBlogCommand({ ...data, blogId });

    const result = await this.commandBus.execute<
      UpdateBlogCommand,
      LayerNoticeInterceptor<boolean>
    >(command);

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param('id') blogId: string
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

    // if (userInfo.userId !== blog.ownerInfo.userId) {
    //   throw new ForbiddenException();
    // }

    const command = new DeleteBlogCommand(blogId);
    await this.commandBus.execute(command);
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('id') blogId: string,
    @Param('postId') postId: string
    //@CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!blog || !post) throw new NotFoundException();

    //if (userInfo.userId !== blog.ownerInfo.userId)
    // throw new ForbiddenException();

    const command = new DeletePostCommand(postId);
    await this.commandBus.execute(command);
  }
}
