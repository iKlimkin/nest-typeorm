import { InputCommentModel } from "../../../api/models/input.comment.models";

export class CreateCommentSqlCommand {
  constructor(public inputData: InputCommentModel) {}
}
