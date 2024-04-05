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
import { SetUserIdGuard } from '../../../../infra/guards/set-user-id.guard';
import { ObjectIdPipe } from '../../../../infra/pipes/valid-objectId.pipe';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { InputPostModelByBlogId } from '../../../posts/api/models/input.posts.models/create.post.model';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { PostsSqlQueryRepo } from '../../../posts/api/query-repositories/posts-query.sql-repo';
import { CreatePostSqlCommand } from '../../../posts/application/use-cases/commands/create-post-sql.command';
import { CreateBlogSqlCommand } from '../../application/use-case/commands/create-blog-sql.command';
import { DeleteBlogSqlCommand } from '../../application/use-case/commands/delete-blog-sql.command';
import { UpdateBlogSqlCommand } from '../../application/use-case/commands/update-blog-sql.command';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { InputBlogModel } from '../models/input.blog.models/create.blog.model';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsSqlQueryRepo } from '../query-repositories/blogs.query.sql-repo';
import { BlogsTORQueryRepo } from '../query-repositories/blogs.query.typeorm-repo';
import { PostsTORQueryRepo } from '../../../posts/api/query-repositories/posts-query.typeorm-repo';

@Controller('blogs')
export class BlogsSqlController {
  constructor(
    private readonly blogsSqlQueryRepo: BlogsSqlQueryRepo,
    private readonly blogQueryRepo: BlogsTORQueryRepo,
    private readonly postsSqlQueryRepo: PostsSqlQueryRepo,
    private readonly postsQueryRepo: PostsTORQueryRepo,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    const result = await this.blogQueryRepo.getAllBlogs(query);

    if (!result) {
      throw new InternalServerErrorException();
    }

    return result;
  }

  @Get(':id')
  async getBlogById(
    @Param('id', ObjectIdPipe) blogId: string,
  ): Promise<BlogViewModelType> {
    const foundBlog = await this.blogQueryRepo.getBlogById(blogId);

    if (!foundBlog) {
      throw new NotFoundException('blog not found');
    }

    return foundBlog;
  }

  @Get(':id/posts')
  @UseGuards(SetUserIdGuard)
  async getPosts(
    @CurrentUserId() userId: string,
    @Param('id', ObjectIdPipe) blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogQueryRepo.getBlogById(blogId);

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
    @Body() createBlogModel: InputBlogModel,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogSqlCommand(createBlogModel);

    const blog = await this.commandBus.execute<CreateBlogSqlCommand, OutputId>(
      command,
    );

    const result = await this.blogsSqlQueryRepo.getBlogById(blog.id);

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
    @Body() inputBlogDto: InputBlogModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdateBlogSqlCommand({ ...inputBlogDto, blogId }),
    );

    if (!result) {
      throw new NotFoundException();
    }
  }

  @Delete(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id', ObjectIdPipe) blogId: string) {
    const command = new DeleteBlogSqlCommand(blogId);
    const result = await this.commandBus.execute(command);

    if (!result) {
      throw new NotFoundException();
    }
  }
}
