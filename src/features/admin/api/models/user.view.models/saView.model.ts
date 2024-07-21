import { UserAccount } from '../../../domain/entities/user-account.entity';
import {
  BloggerBannedUsersViewType,
  SAViewWithBannedUsersType,
} from './userAdmin.view-type';

export const getSAViewModel = (
  user: UserAccount,
): SAViewWithBannedUsersType => ({
  id: user.id,
  login: user.login,
  email: user.email,
  createdAt: user.created_at.toISOString(),
  banInfo: {
    isBanned: user.userBan?.isBanned || false,
    banDate: user.userBan?.banDate || null,
    banReason: user.userBan?.banReason || null,
  },
});

export const getBloggerBannedUsersView = (
  user: UserBloggerBannedRaw,
): BloggerBannedUsersViewType => ({
  id: user.id,
  login: user.login,
  banInfo: {
    isBanned: true,
    banDate: user.banDate.toISOString(),
    banReason: user.banReason,
  },
});

type UserBloggerBannedRaw = {
  id: string;
  login: string;
  banDate: Date;
  banReason: string;
};
