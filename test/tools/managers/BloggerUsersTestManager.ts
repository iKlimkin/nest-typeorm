import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaginationViewModel } from '../../../src/domain/sorting-base-filter';
import { InputUserBloggerBanDto } from '../../../src/features/admin/api/models/input-sa.dtos.ts/user-restriction.dto';
import { BloggerBannedUsersQueryFilter } from '../../../src/features/admin/api/models/outputSA.models.ts/blogger-banned-users.query';
import { BannedBlogUsersType } from '../../../src/features/admin/api/models/user.view.models/bloggerUsers.view-type';
import { SuperTestBody } from '../models/body.response.model';
import { BloggerUsersRouting } from '../routes/bloggerUsers.routing';
import { BaseTestManager } from './BaseTestManager';

export class BloggerUsersTestManager extends BaseTestManager {
  protected readonly application: INestApplication<HttpServer>;

  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: BloggerUsersRouting,
  ) {
    super(routing, app);
  }

  getBannedUsersForCurrentBlog = async (
    blogId: string,
    accessToken: string,
    query?: Partial<BloggerBannedUsersQueryFilter>,
    expectStatus = HttpStatus.OK,
  ): Promise<PaginationViewModel<BannedBlogUsersType>> => {
    let bannedUsersWithPagination: PaginationViewModel<BannedBlogUsersType> =
      null;
    await request(this.application)
      .get(this.routing.getBannedUsersForBlog(blogId))
      .auth(accessToken || 'crap', this.constants.authBearer)
      .query(query)
      .expect(expectStatus)
      .expect(
        async ({
          body,
        }: SuperTestBody<PaginationViewModel<BannedBlogUsersType>>) => {
          body.items.forEach((user) => {
            expect(user.banInfo.isBanned).toBeTruthy();
          });
          bannedUsersWithPagination = body;
        },
      );

    return bannedUsersWithPagination;
  };

  createBanRestriction = (data: Partial<InputUserBloggerBanDto>) => ({
    isBanned: data.isBanned,
    banReason: data.banReason || 'The reason why user was banned or unbunned',
    blogId: data.blogId || ' ',
  });

  async banUnbanRestriction(
    userId: string,
    accessToken: string,
    banInfoDto: InputUserBloggerBanDto,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .put(this.routing.banUnbanRestriction(userId))
      .auth(accessToken, this.constants.authBearer)
      .send(banInfoDto)
      .expect(expectStatus)
      .expect(async (response) => {
        if (response.status === HttpStatus.NO_CONTENT) {
          const userAfterBanUnban = await this.getUserDirectly(userId);
          console.log(userAfterBanUnban.bloggerBans);

          expect(userAfterBanUnban.bloggerBans[0]).toEqual(
            expect.objectContaining({
              isBanned: banInfoDto.isBanned,
              banReason: banInfoDto.banReason || null,
            }),
          );
        }
      });
  }

  private getUserDirectly = async (userId: string) => {
    try {
      return this.usersRepo.findOne({
        where: { id: userId },
        relations: {
          bloggerBans: true,
        },
      });
    } catch (e) {
      console.error({ e });
      return null;
    }
  };
}
