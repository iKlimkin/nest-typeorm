export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public content: string,
  ) {}
}
