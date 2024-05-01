import {
  Body,
  Controller,
  Delete,
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
} from './index';

@Controller('blogs')
export class BlogsController {
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

    if (!result) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':id')
  async getBlogById(@Param('id') blogId: string): Promise<BlogViewModelType> {
    const foundBlog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!foundBlog) {
      throw new NotFoundException('blog not found');
    }

    return foundBlog;
  }

  @Get(':id/posts')
  @UseGuards(SetUserIdGuard)
  async getPosts(
    @CurrentUserId() userId: string,
    @Param('id') blogId: string,
    @Query() query: PostsQueryFilter
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    const posts = await this.postsQueryRepo.getPostsByBlogId(
      blogId,
      query,
      userId
    );

    if (!posts) throw new Error();

    return posts;
  }

  @Post()
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand(data);

    const blog = await this.commandBus.execute<CreateBlogCommand, OutputId>(
      command
    );

    const result = await this.blogsQueryRepo.getBlogById(blog.id);

    if (!result) throw new Error();

    return result;
  }

  @Put(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    @Body() data: UpdateBlogInputDto
  ) {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException();
    }

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
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') blogId: string) {
    const command = new DeleteBlogCommand(blogId);
    const result = await this.commandBus.execute(command);

    if (!result) {
      throw new NotFoundException();
    }
  }
}
