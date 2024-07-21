import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

import { UsersRepository } from '../../infrastructure/users.repo';
import { BanUnbanBloggerCommand } from '../commands/banUnbanBlogger.command';
import { BlogService } from '../../../blogs/application/blog.service';
import { UserBloggerBans } from '../../../blogs/domain/entities/user-blogger-bans.entity';
import { UserBans } from '../../../auth/domain/entities/user-bans.entity';
import { not } from 'joi';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';

@CommandHandler(BanUnbanBloggerCommand)
export class BanUnbanBloggerUseCase
  implements ICommandHandler<BanUnbanBloggerCommand>
{
  private readonly location = this.constructor.name;
  constructor(
    private usersRepo: UsersRepository,
    private dataSource: DataSource,
    private blogService: BlogService,
  ) {}

  async execute(
    command: BanUnbanBloggerCommand,
  ): Promise<LayerNoticeInterceptor> {
    return runInTransaction(this.dataSource, async (manager) => {
      let notice = new LayerNoticeInterceptor();
      const { isBanned, banReason, blogId, userIdToBan, ownerId } =
        command.data;

      const userExistenceCheck = await this.usersRepo.getUserById(userIdToBan);

      if (!userExistenceCheck) {
        notice.addError('User not found', this.location, GetErrors.NotFound);
        return notice;
      }

      const blogServiceNotice =
        await this.blogService.validateBlogAndUserRights(blogId, ownerId);

      if (blogServiceNotice.hasError)
        return blogServiceNotice as LayerNoticeInterceptor<null>;

      const userBloggerBanInfo = await this.usersRepo.getEntityBanInfo(
        UserBloggerBans,
        userIdToBan,
        manager,
      );

      let userRestrictionData: UserBans;
      if (userBloggerBanInfo) {
        const userRestrictionResponse = await userBloggerBanInfo.updateBanInfo(
          isBanned,
          banReason,
        );
        if (userRestrictionResponse.hasError)
          return userRestrictionResponse as LayerNoticeInterceptor;
        userRestrictionData = userRestrictionResponse.data;
      } else {
        const userRestrictionResponse = await UserBloggerBans.create({
          banReason,
          blogId,
          userId: userIdToBan,
          isBanned,
        });

        if (userRestrictionResponse.hasError)
          return userRestrictionResponse as LayerNoticeInterceptor;
        userRestrictionData = userRestrictionResponse.data;
      }

      await this.usersRepo.saveByEntity(
        UserBloggerBans,
        userRestrictionData,
        manager,
      );

      return notice;
    });
  }
}
