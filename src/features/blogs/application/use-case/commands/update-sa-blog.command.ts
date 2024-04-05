import { UpdateBlogDto } from "../../../api/models/input.blog.models/update-blog-models";

export class UpdateSABlogCommand {
    constructor(public updateData: UpdateBlogDto) {}
  }
