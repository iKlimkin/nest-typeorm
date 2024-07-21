import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseBanEntity } from '../../../../domain/base-ban-entity';
import { UserRestrictionCommandDto } from '../../../admin/api/models/input-sa.dtos.ts/user-restriction.dto';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@Entity()
export class UserBans extends BaseBanEntity {
  @OneToOne('UserAccount', 'userBans')
  @JoinColumn()
  user: UserAccount;

  static async create(restrictionDto: UserRestrictionCommandDto) {
    const notice = new LayerNoticeInterceptor<UserBans>();
    const { banReason, isBanned, userId } = restrictionDto;
    const userBloggerBan = new UserBans();
    userBloggerBan.banReason = banReason;
    userBloggerBan.user = { id: userId } as UserAccount;
    userBloggerBan.isBanned = isBanned;
    userBloggerBan.banDate = isBanned ? new Date() : null;

    await notice.validateFields(userBloggerBan);
    notice.addData(userBloggerBan);
    return notice;
  }
}
