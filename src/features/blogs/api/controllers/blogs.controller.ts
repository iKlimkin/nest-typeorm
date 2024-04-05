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
import { OutputId } from '../../../../domain/likes.types';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { SetUserIdGuard } from '../../../auth/infrastructure/guards/set-user-id.guard';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { PostsQueryRepo } from '../../../posts/api/query-repositories/posts.query.repo';
import { CreateBlogCommand } from '../../application/use-case/commands/create-blog.command';
import { DeleteBlogCommand } from '../../application/use-case/commands/delete-blog.command';
import { UpdateBlogCommand } from '../../application/use-case/commands/update-blog.command';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { CreateBlogInputDto } from '../models/input.blog.models/create.blog.model';
import { UpdateBlogInputDto } from '../models/input.blog.models/update-blog-models';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';

@Controller('blogs')
export class BlogsController {
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
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    const posts = await this.postsQueryRepo.getPostsByBlogId(
      blogId,
      query,
      userId,
    );

    if (!posts) throw new Error();

    return posts;
  }

  @Post()
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand(data);

    const blog = await this.commandBus.execute<CreateBlogCommand, OutputId>(
      command,
    );

    const result = await this.blogsQueryRepo.getBlogById(blog.id);

    if (!result) throw new Error();

    return result;
  }

  // @Post(':id/posts')
  // @UseGuards(BasicSAAuthGuard)
  // @HttpCode(HttpStatus.CREATED)
  // async createPostForBlog(
  //   @Param('id', ObjectIdPipe) blogId: string,
  //   @Body() body: InputPostModelByBlogId,
  // ): Promise<PostViewModelType> {
  //   const command = new CreatePostSqlCommand({ ...body, blogId });

  //   const post = await this.commandBus.execute<CreatePostSqlCommand, LayerNoticeInterceptor<OutputId | null>>(command);

  //   if (post.hasError()) {
  //     throw new InternalServerErrorException('Post not created');
  //   }

  //   const newlyCreatedPost = await this.postsSqlQueryRepo.getPostById(post.data!.id);

  //   if (!newlyCreatedPost) {
  //     throw new Error('Newest post not found');
  //   }

  //   return newlyCreatedPost;
  // }

  @Put(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    @Body() data: UpdateBlogInputDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateBlogCommand({ ...data, blogId }),
    );

    if (!result) {
      throw new NotFoundException();
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
