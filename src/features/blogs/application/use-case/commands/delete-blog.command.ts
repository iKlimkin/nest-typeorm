export class DeleteBlogCommand {
  constructor(public data: InputDeleteData) {}
}

type InputDeleteData = {
  blogId: string;
  userId: string;
};
