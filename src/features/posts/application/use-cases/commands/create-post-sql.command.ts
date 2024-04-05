import { CreatePostByBlogIdModel, InputPostModel } from '../../../api/models/input.posts.models/create.post.model';

export class CreatePostSqlCommand {
  constructor(public createDataDto: CreatePostByBlogIdModel) {
  }
}
