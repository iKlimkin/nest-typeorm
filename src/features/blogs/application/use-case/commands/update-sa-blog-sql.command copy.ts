import { UpdateBlogCommandType } from "../../../api/models/input.blog.models/update-blog-models";

export class UpdateSABlogSqlCommand {
    constructor(public updateBlogDto: UpdateBlogCommandType) {}
  }
