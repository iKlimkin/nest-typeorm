import { IsBoolean, IsUUID } from 'class-validator';
import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';
import { contentPostLength } from '../../../../../domain/validation.constants';

export class UserRestrictionDto {
  @IsBoolean()
  isBanned: boolean;

  @iSValidField(contentPostLength)
  banReason: string;
}

export class UserBloggerRestrictionDto {}

export interface UserRestrictionCommandDto extends UserRestrictionDto {
  userId: string;
}

export class InputUserBloggerBanDto extends UserRestrictionDto {
  // @IsUUID()
  blogId: string;
}

export class UserBloggerBanDto extends UserRestrictionDto {
  // @IsUUID()
  blogId: string;
  // @IsUUID()
  ownerId: string;
  // @IsUUID()
  userIdToBan: string;
}

export interface CreateBloggerBanInfoDto extends UserRestrictionDto {
  blogId: string;
  userId: string;
}
