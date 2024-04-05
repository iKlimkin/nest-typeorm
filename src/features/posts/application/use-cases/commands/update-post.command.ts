import { UpdatePostDto } from "../../../api/models/input.posts.models/create.post.model";

export class UpdatePostCommand {
  constructor(public updateData: UpdatePostDto) {}
}
