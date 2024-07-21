import { UserBloggerBanDto } from '../../api/models/input-sa.dtos.ts/user-restriction.dto';

export class BanUnbanBloggerCommand {
  constructor(public data: UserBloggerBanDto) {}
}
