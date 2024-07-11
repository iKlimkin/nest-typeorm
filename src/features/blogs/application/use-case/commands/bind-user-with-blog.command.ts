export class BindUserWithBlogCommand {
  constructor(public data: IBindBlogWihUser) {}
}

interface IBindBlogWihUser {
  userId: string;
  blogId: string;
}
