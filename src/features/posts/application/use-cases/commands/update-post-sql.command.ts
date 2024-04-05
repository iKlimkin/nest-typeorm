import { UpdatePostModel } from "../../../api/models/input.posts.models/create.post.model";

export class UpdatePostSqlCommand {
  constructor(public updatePostDto: UpdatePostModel) {}
}
