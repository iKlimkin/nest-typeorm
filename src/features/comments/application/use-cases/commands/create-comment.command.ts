import { InputCommentDto } from '../../../api/models/input.comment.models/comment.models';

export class CreateCommentCommand {
  constructor(public createData: InputCommentDto) {}
}
