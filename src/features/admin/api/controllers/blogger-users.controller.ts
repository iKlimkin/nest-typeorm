import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BanUnbanBloggerCommand } from '../../application/commands/banUnbanBlogger.command';
import { InputUserBloggerBanDto } from '../models/input-sa.dtos.ts/user-restriction.dto';
import { BannedBlogUsersType } from '../models/user.view.models/bloggerUsers.view-type';
import { BloggerBannedUsersQueryFilter } from '../models/outputSA.models.ts/blogger-banned-users.query';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';
import { UsersQueryRepo } from '../query-repositories/users.query.repo';
import { BloggerCrudApiService } from '../../application/bloggerCrudApi.service';
import { BlogsQueryRepo } from '../../../blogs/api/query-repositories/blogs.query.repo';

@UseGuards(AccessTokenGuard)
@Controller(RouterPaths.bloggerUsers)
export class BloggerUsersController {
  constructor(
    private bloggerCrudApiService: BloggerCrudApiService<BanUnbanBloggerCommand>,
    private blogQueryRepo: BlogsQueryRepo,
    private usersQueryRepo: UsersQueryRepo,
  ) {}

  @Get('blog/:id')
  @HttpCode(HttpStatus.OK)
  async getBannedUsersForBlog(
    @Param('id') blogId: string,
    @Query() query: BloggerBannedUsersQueryFilter,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PaginationViewModel<BannedBlogUsersType>> {
    const blog = await this.blogQueryRepo.getBlogWithUserInfo(blogId);
    if (!blog) throw new NotFoundException('Blog not found');
    if (blog.user.id !== userInfo.userId)
      throw new ForbiddenException('access error');
    return this.usersQueryRepo.getBannedUsersForBlog(blogId, query);
  }

  @Put(':id/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUnbanRestriction(
    @Param('id') userIdToBan: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() body: InputUserBloggerBanDto,
  ) {
    const command = new BanUnbanBloggerCommand({
      ownerId: userInfo.userId,
      userIdToBan,
      ...body,
    });
    await this.bloggerCrudApiService.updateOrDelete(command);
  }
}
