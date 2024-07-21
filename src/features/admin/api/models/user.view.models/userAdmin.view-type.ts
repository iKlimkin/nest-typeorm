export type BanUserInfo = {
  isBanned: boolean;
  banDate: Date | string;
  banReason: string;
};
export type SAViewType = {
  /**
   * id of the existing user
   */
  id: string;

  /**
   *  user's login
   */
  login: string;

  /**
   * user's email
   */
  email: string;

  /**
   * user creation date
   */
  createdAt: string | Date;
};

export type SAViewWithBannedUsersType = SAViewType & {
  banInfo: BanUserInfo;
};

export type BloggerBannedUsersViewType = {
  id: string;
  login: string;
  banInfo: BanUserInfo;
};
