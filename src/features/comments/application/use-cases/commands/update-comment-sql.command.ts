export class UpdateCommentSqlCommand {
    constructor(
      public commentId: string,
      public content: string,
    ) {}
  }