import { Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseBanEntity } from '../../../../domain/base-ban-entity';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { CreateBloggerBanInfoDto } from '../../../admin/api/models/input-sa.dtos.ts/user-restriction.dto';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Blog } from './blog.entity';

@Entity()
export class UserBloggerBans extends BaseBanEntity {
  @OneToOne('Blog', 'bloggerBan')
  @JoinColumn()
  blog: Blog;
  // @Column()
  // blogId: string;

  @ManyToOne('UserAccount', 'bloggerBans')
  @JoinColumn()
  user: UserAccount;

  static async create(restrictionDto: CreateBloggerBanInfoDto) {
    const notice = new LayerNoticeInterceptor<UserBloggerBans>();
    const { banReason, isBanned, userId, blogId } = restrictionDto;
    const userBloggerBan = new UserBloggerBans();
    userBloggerBan.banReason = banReason;
    userBloggerBan.user = { id: userId } as UserAccount;
    userBloggerBan.isBanned = isBanned;
    userBloggerBan.banDate = isBanned ? new Date() : null;
    userBloggerBan.blog = { id: blogId } as Blog;

    await notice.validateFields(userBloggerBan);
    notice.addData(userBloggerBan);
    return notice;
  }
}
