import { ReactionCommentDto } from '../../../api/models/input.comment.models/comment.models';

export class UpdateCommentReactionCommand {
  constructor(public updateData: ReactionCommentDto) {}
}
