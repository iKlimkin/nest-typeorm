import { UpdateBlogCommandType } from "../../../api/models/input.blog.models/update-blog-models";

export class UpdateBlogSqlCommand {
    constructor(public updateBlogDto: UpdateBlogCommandType) {}
  }
