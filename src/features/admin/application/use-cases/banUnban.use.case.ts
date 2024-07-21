import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { UserBans } from '../../../auth/domain/entities/user-bans.entity';
import { UsersRepository } from '../../infrastructure/users.repo';
import { BanUnbanCommand } from '../commands/banUnban.command';
import { SecurityRepository } from '../../../security/infrastructure/security.repository';

@CommandHandler(BanUnbanCommand)
export class BanUnbanUserUseCase implements ICommandHandler<BanUnbanCommand> {
  constructor(
    private usersRepo: UsersRepository,
    private dataSource: DataSource,
    private securityRepo: SecurityRepository,
  ) {}

  async execute(command: BanUnbanCommand): Promise<LayerNoticeInterceptor> {
    return runInTransaction(this.dataSource, async (manager) => {
      let notice = new LayerNoticeInterceptor();
      const { isBanned, banReason, userId } = command.data;

      const userBanInfo = await this.usersRepo.getEntityBanInfo(
        UserBans,
        userId,
        manager,
      );

      let userRestrictionData: UserBans;
      if (userBanInfo) {
        const userRestrictionResponse = await userBanInfo.updateBanInfo(
          isBanned,
          banReason,
        );
        if (userRestrictionResponse.hasError)
          return userRestrictionResponse as LayerNoticeInterceptor;
        userRestrictionData = userRestrictionResponse.data;
      } else {
        const userRestrictionResponse = await UserBans.create(command.data);

        if (userRestrictionResponse.hasError)
          return userRestrictionResponse as LayerNoticeInterceptor;
        userRestrictionData = userRestrictionResponse.data;
      }

      await this.usersRepo.saveRestrictionUserInfo(
        userRestrictionData,
        manager,
      );

      if (userRestrictionData.isBanned) {
        await this.securityRepo.deleteRefreshTokensBannedUser(userId, manager);
      }

      return notice;
    });
  }
}
