import { UpdateReactionModelType } from '../../../../../domain/likes.types';

export class UpdatePostReactionSqlCommand {
  constructor(public updatePostReactionDto: UpdateReactionModelType) {}
}
