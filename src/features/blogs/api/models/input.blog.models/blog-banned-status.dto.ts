import { IsBoolean } from 'class-validator';

export class InputBlogBannedStatus {
  @IsBoolean()
  isBanned: boolean;
}

export type BanUnbanBlogCommandType = InputBlogBannedStatus & {
  blogId: string;
};
