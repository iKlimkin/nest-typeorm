import { CreatePostByBlogIdModel } from '../../../api/models/input.posts.models/create.post.model';

export class CreatePostCommand {
  constructor(public data: CreatePostByBlogIdModel) {}
}
