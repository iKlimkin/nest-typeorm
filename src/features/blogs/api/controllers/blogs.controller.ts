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
import { SetUserIdGuard } from '../../../../infra/guards/set-user-id.guard';
import { ObjectIdPipe } from '../../../../infra/pipes/valid-objectId.pipe';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { InputPostModelByBlogId } from '../../../posts/api/models/input.posts.models/create.post.model';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { PostsQueryRepository } from '../../../posts/api/query-repositories/posts.query.repo';
import { CreatePostCommand } from '../../../posts/application/use-cases/create-post-use-case';
import { CreateBlogCommand } from '../../application/use-case/create-blog-use-case';
import { UpdateBlogCommand } from '../../application/use-case/update-blog-use-case';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { InputBlogModel } from '../models/input.blog.models/create.blog.model';
import { BlogType } from '../models/output.blog.models/blog.models';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { DeleteBlogCommand } from '../../application/use-case/delete-blog-use-case';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogType>> {
    return this.blogsQueryRepo.getBlogsByQuery(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getBlogById(
    @Param('id', ObjectIdPipe) blogId: string,
  ): Promise<BlogViewModelType> {
    const foundBlog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!foundBlog) {
      throw new NotFoundException('blog not found');
    }

    return foundBlog;
  }

  @Get(':id/posts')
  @UseGuards(SetUserIdGuard)
  async getPostsByBlogId(
    @CurrentUserId() userId: string,
    @Param('id', ObjectIdPipe) blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    const foundPostsByBlogId = await this.postsQueryRepo.getPostsByBlogId(
      blogId,
      query,
      userId,
    );

    return foundPostsByBlogId;
  }

  @Post()
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() createBlogDto: InputBlogModel,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand(createBlogDto);

    const blog = await this.commandBus.execute<CreateBlogCommand, OutputId>(
      command,
    );

    const newlyCreatedBlog = await this.blogsQueryRepo.getBlogById(blog.id);

    if (!newlyCreatedBlog) {
      throw new NotFoundException('Newest created blog not found');
    }

    return newlyCreatedBlog;
  }

  @Post(':id/posts')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPostByBlogId(
    @Param('id', ObjectIdPipe) blogId: string,
    @Body() body: InputPostModelByBlogId,
  ): Promise<PostViewModelType> {
    const command = new CreatePostCommand({ ...body, blogId });

    const createdPost = await this.commandBus.execute(command);

    const newlyCreatedPost = await this.postsQueryRepo.getPostById(
      createdPost.id,
    );

    if (!newlyCreatedPost) {
      throw new NotFoundException('Newest post not found');
    }

    return newlyCreatedPost;
  }

  @Put(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id', ObjectIdPipe) blogId: string,
    @Body() inputBlogDto: InputBlogModel,
  ) {
    const updatedBlog = await this.commandBus.execute(
      new UpdateBlogCommand({ blogId, ...inputBlogDto }),
    );

    if (!updatedBlog) {
      throw new NotFoundException('blog not found');
    }
  }

  @Delete(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id', ObjectIdPipe) blogId: string) {
    const deleteBlog = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );

    if (!deleteBlog) {
      throw new NotFoundException('blog not found');
    }
  }
}
