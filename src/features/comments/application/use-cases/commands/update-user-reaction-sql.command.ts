import { ReactionDataModel } from "../../../api/models/input.comment.models";

export class UpdateCommentReactionSqlCommand {
    constructor(public inputData: ReactionDataModel) {}
}