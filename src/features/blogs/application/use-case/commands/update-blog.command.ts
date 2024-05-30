import { UpdateBlogDto } from '../../../api/models/input.blog.models/update-blog-models';

export class UpdateBlogCommand {
  constructor(public updateData: UpdateBlogDto) {}
}
