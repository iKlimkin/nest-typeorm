import { UpdateBloggerPostData } from '../../../api/models/dtos/blog-dto.model';

export class UpdateBloggerPostCommand {
  constructor(public data: UpdateBloggerPostData) {}
}
