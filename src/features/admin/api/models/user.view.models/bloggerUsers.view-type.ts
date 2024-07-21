import { BanUserInfo } from './userAdmin.view-type';

export type BannedBlogUsersType = {
  id: string;
  login: string;
  banInfo: BanUserInfo;
};
