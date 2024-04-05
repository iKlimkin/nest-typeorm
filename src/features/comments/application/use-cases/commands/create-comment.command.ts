import { InputCommentModel } from "../../../api/models/input.comment.models";

export class CreateCommentCommand {
  constructor(public inputData: InputCommentModel) {}
}
