import { UserRestrictionCommandDto } from '../../api/models/input-sa.dtos.ts/user-restriction.dto';

export class BanUnbanCommand {
  constructor(public data: UserRestrictionCommandDto) {}
}
