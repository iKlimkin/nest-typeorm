import { PostReactionDto } from '../../../../../domain/reaction.models';

export class UpdatePostReactionCommand {
  constructor(public updateData: PostReactionDto) {}
}
