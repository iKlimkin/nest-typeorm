export class CommentDtoSqlModel {
  constructor(public createCommentDto: CreateCommentSqlType) {}
}

type CreateCommentSqlType = {
  postId: string;
  userId: string;
  userlogin: string;
  content: string;
};
