export class UnsubscribeBlogCommand {
  constructor(
    public userId: string,
    public blogId: string,
  ) {}
}
