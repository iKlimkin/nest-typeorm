export class DeleteBloggerPostCommand {
  constructor(public data: InputDeleteData) {}
}

type InputDeleteData = {
  blogId: string;
  userId: string;
  postId: string;
};
