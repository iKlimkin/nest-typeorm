import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { BlogCrudApiService } from '../../application/base.crud.api.service';
import { BindUserWithBlogCommand } from '../../application/use-case/commands/bind-user-with-blog.command';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';

@UseGuards(BasicSAAuthGuard)
@Controller(RouterPaths.SABlogs)
export class SABlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly blogCrudApiService: BlogCrudApiService<BindUserWithBlogCommand>,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    return this.blogsQueryRepo.getAllBlogs(query, true);
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
}
