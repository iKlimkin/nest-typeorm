import { CreatePostByBlogIdModel, InputPostModel } from '../../../api/models/input.posts.models/create.post.model';

export class CreatePostCommand {
  constructor(public createDataDto: CreatePostByBlogIdModel) {
  }
}
