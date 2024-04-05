import { ReactionDataModel } from "../../../api/models/input.comment.models";

export class UpdateCommentReactionCommand {
    constructor(public inputData: ReactionDataModel) {}
}