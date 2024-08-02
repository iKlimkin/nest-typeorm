import { BanUnbanBlogCommandType } from '../../../api/models/input.blog.models/blog-banned-status.dto';

export class BanUnbanBlogCommand {
  constructor(public data: BanUnbanBlogCommandType) {}
}
