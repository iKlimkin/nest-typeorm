import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RouterPaths } from '../../../../infra/utils/routing';
import { BlogCrudApiService } from '../../../../domain/base-services/base.crud.api.service';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { BanUnbanBlogCommand } from '../../application/use-case/commands/banUnbanBlog.command';
import { BindUserWithBlogCommand } from '../../application/use-case/commands/bind-user-with-blog.command';
import { InputBlogBannedStatus } from '../models/input.blog.models/blog-banned-status.dto';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { SABlogsViewType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';

@UseGuards(BasicSAAuthGuard)
@Controller(RouterPaths.SABlogs)
export class SABlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly blogCrudApiService: BlogCrudApiService<
      BindUserWithBlogCommand | BanUnbanBlogCommand
    >,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<SABlogsViewType>> {
    return this.blogsQueryRepo.getAllBlogs(query, null, true) as Promise<
      PaginationViewModel<SABlogsViewType>
    >;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/bind-with-user/:userId')
  async bindBlogWithUser(
    @Param('id') blogId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const command = new BindUserWithBlogCommand({ userId, blogId });
    return this.blogCrudApiService.updateOrDelete(command);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/ban')
  async banUnbanDefinedBlog(
    @Param('id') blogId: string,
    @Body() inputStatus: InputBlogBannedStatus,
  ): Promise<void> {
    const command = new BanUnbanBlogCommand({ ...inputStatus, blogId });
    return this.blogCrudApiService.updateOrDelete(command);
  }
}
