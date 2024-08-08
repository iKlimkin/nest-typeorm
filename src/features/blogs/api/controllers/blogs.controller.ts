import {
  UseGuards,
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Post,
  Delete,
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
import { CommandBus } from '@nestjs/cqrs';
import { SubscribeBlogCommand } from '../../application/use-case/commands/subscribe-blog.command';
import { UnsubscribeBlogCommand } from '../../application/use-case/commands/unSubscribe-blog.command';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';
import { BlogsCrudApiService } from '../../application/services/blogs-crud-api.service';
import { AccessTokenGuard } from '../../../comments/api/controllers';

@Controller(RouterPaths.blogs)
export class BlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
    private readonly blogsCrudApiService: BlogsCrudApiService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Post(':id/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribeToBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<void> {
    const command = new SubscribeBlogCommand(userInfo.userId, blogId);
    return this.blogsCrudApiService.create(command);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeToBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<void> {
    const command = new UnsubscribeBlogCommand(userInfo.userId, blogId);
    return this.blogsCrudApiService.create(command);
  }

  @Get()
  @UseGuards(SetUserIdGuard)
  async getBlogs(
    @Query() query: BlogsQueryFilter,
    @CurrentUserId() userId: string,
  ): Promise<PaginationViewModel<BlogViewModelType | SABlogsViewType>> {
    return this.blogsQueryRepo.getAllBlogs(query, userId);
  }

  @Get(':id')
  @UseGuards(SetUserIdGuard)
  async getBlog(
    @Param('id') blogId: string,
    @CurrentUserId() userId: string,
  ): Promise<BlogViewModelType> {
    const result = await this.blogsQueryRepo.getById(blogId, userId);
    if (!result) throw new NotFoundException('blog not found');
    return result;
  }

  @Get(':id/posts')
  @UseGuards(SetUserIdGuard)
  async getPosts(
    @Param('id') blogId: string,
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
